import SwiftUI
import WidgetKit

@main
struct MinestWidgetBundle: WidgetBundle {
    var body: some Widget {
        MinestLiveActivityWidget()
        MinestStaticWidget()
        if #available(iOS 18.0, *) {
            MinestFocusControlWidget()
            MinestCompleteControlWidget()
            MinestDrawControlWidget()
        }
    }
}
