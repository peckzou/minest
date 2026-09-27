import WidgetKit
import AppIntents
import SwiftUI

/// iOS 18+ Control Center & Lock Screen Quick Controls for Minest
@available(iOS 18.0, *)
public struct MinestFocusControlWidget: ControlWidget {
    public static let kind: String = "com.zouminmin.minest.control.focus"
    
    public init() {}
    
    public var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: StartFocusIntent()) {
                Label("开启专注", systemImage: "timer")
            }
        }
        .displayName("Minest 专注")
        .description("在控制中心或锁屏快捷启动 Minest 灵动岛与锁屏专注计时")
    }
}

@available(iOS 18.0, *)
public struct MinestCompleteControlWidget: ControlWidget {
    public static let kind: String = "com.zouminmin.minest.control.complete"
    
    public init() {}
    
    public var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: CompleteCardIntent()) {
                Label("完成任务", systemImage: "checkmark.circle.fill")
            }
        }
        .displayName("Minest 打勾")
        .description("在控制中心或锁屏快捷打勾完成当前任务")
    }
}

@available(iOS 18.0, *)
public struct MinestDrawControlWidget: ControlWidget {
    public static let kind: String = "com.zouminmin.minest.control.draw"
    
    public init() {}
    
    public var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: DrawRandomCardIntent()) {
                Label("随机抽卡", systemImage: "sparkles.rectangle.stack.fill")
            }
        }
        .displayName("Minest 抽卡")
        .description("在控制中心或锁屏快捷抽取一张看板卡片")
    }
}
