import Foundation
import HealthKit
import Combine

// MARK: - Watch 4.0: HealthKit workout session for the focus timer
//
// A running HKWorkoutSession keeps Minest frontmost on wrist raise (screen stays on the
// timer, Always On shows the reduced cadence) and streams live heart rate.
// Without HealthKit permission the focus timer still works as a plain timer.

final class FocusHealthSession: NSObject, ObservableObject {
    static let shared = FocusHealthSession()

    @Published private(set) var heartRate: Double = 0
    @Published private(set) var isSessionActive = false
    @Published private(set) var isAuthorized = false

    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    private override init() { super.init() }

    /// Ask once for workout write + heart rate read; safe to call repeatedly.
    func requestAuthorization(completion: ((Bool) -> Void)? = nil) {
        guard HKHealthStore.isHealthDataAvailable() else { completion?(false); return }
        let share: Set<HKSampleType> = [HKObjectType.workoutType()]
        var read: Set<HKObjectType> = [HKObjectType.workoutType()]
        if let hr = HKObjectType.quantityType(forIdentifier: .heartRate) { read.insert(hr) }
        store.requestAuthorization(toShare: share, read: read) { [weak self] ok, _ in
            DispatchQueue.main.async {
                self?.isAuthorized = ok
                completion?(ok)
            }
        }
    }

    /// Prompt for permission the first time only, then continue (granted or not).
    func prepare(_ completion: @escaping () -> Void) {
        guard HKHealthStore.isHealthDataAvailable(),
              store.authorizationStatus(for: HKObjectType.workoutType()) == .notDetermined else {
            completion(); return
        }
        requestAuthorization { _ in completion() }
    }

    func start() {
        guard HKHealthStore.isHealthDataAvailable(), session == nil else { return }
        guard store.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized else { return }

        let config = HKWorkoutConfiguration()
        config.activityType = .mindAndBody
        config.locationType = .indoor
        do {
            let session = try HKWorkoutSession(healthStore: store, configuration: config)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: config)
            session.delegate = self
            builder.delegate = self
            self.session = session
            self.builder = builder

            let startDate = Date()
            session.startActivity(with: startDate)
            builder.beginCollection(withStart: startDate) { _, _ in }
            isSessionActive = true
        } catch {
            print("⚠️ [FocusHealth] could not start workout session: \(error.localizedDescription)")
            self.session = nil
            self.builder = nil
        }
    }

    func pause() { session?.pause() }

    func resume() { session?.resume() }

    /// End the session; saves an "Mind & Body" workout when `save` is true, otherwise discards it.
    func end(save: Bool) {
        guard let session = session, let builder = builder else { return }
        session.end()
        let endDate = Date()
        builder.endCollection(withEnd: endDate) { [weak self] _, _ in
            if save {
                builder.finishWorkout { _, _ in self?.cleanUp() }
            } else {
                builder.discardWorkout()
                self?.cleanUp()
            }
        }
    }

    private func cleanUp() {
        DispatchQueue.main.async {
            self.session = nil
            self.builder = nil
            self.isSessionActive = false
            self.heartRate = 0
        }
    }
}

extension FocusHealthSession: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState,
                        from fromState: HKWorkoutSessionState, date: Date) {}

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("⚠️ [FocusHealth] session failed: \(error.localizedDescription)")
        cleanUp()
    }
}

extension FocusHealthSession: HKLiveWorkoutBuilderDelegate {
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        guard let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate),
              collectedTypes.contains(hrType),
              let stats = workoutBuilder.statistics(for: hrType),
              let quantity = stats.mostRecentQuantity() else { return }
        let bpm = quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        DispatchQueue.main.async { self.heartRate = bpm }
    }
}
