import Foundation
import React

@objc(AppInfo)
class AppInfo: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func getAppVersion(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
      resolve(version)
    } else {
      let error = NSError(domain: "", code: 200, userInfo: nil)
      reject("no_version", "No version found", error)
    }
  }
  
  @objc
  func getApplicationQueriesSchemes(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if let schemes = Bundle.main.infoDictionary?["LSApplicationQueriesSchemes"] as? [String] {
      resolve(schemes)
    } else {
      let error = NSError(domain: "", code: 200, userInfo: nil)
      reject("no_schemes", "No LSApplicationQueriesSchemes found", error)
    }
  }
  
  @objc
  func getWiFiAddress(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    var en0Address: String?
    var en1Address: String?
    var en2Address: String?
    var ifaddr: UnsafeMutablePointer<ifaddrs>?

    // 获取网络接口列表
    if getifaddrs(&ifaddr) == 0 {
        var ptr = ifaddr

        while ptr != nil {
            defer { ptr = ptr?.pointee.ifa_next }
            guard let interface = ptr else {
              reject("-1", "no interface", nil)
              return
            }

            // 检查是否是 AF_INET（IPv4）
            let addrFamily = interface.pointee.ifa_addr.pointee.sa_family
            if addrFamily == UInt8(AF_INET) {
                let name = String(cString: interface.pointee.ifa_name)
                if name == "en0" || name == "en1" || name == "en2" {
                    // 将 C 结构体指针转换为 Swift 的 sockaddr 结构体
                    var addr = interface.pointee.ifa_addr.pointee
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    if getnameinfo(&addr, socklen_t(interface.pointee.ifa_addr.pointee.sa_len),
                                    &hostname, socklen_t(hostname.count),
                                    nil, socklen_t(0), NI_NUMERICHOST) == 0 {
                        let currentAddress = String(cString: hostname)
                        if name == "en0" {
                            en0Address = currentAddress
                            break
                        } else if name == "en1" {
                            en1Address = currentAddress
                        } else if name == "en2" {
                            en2Address = currentAddress
                        }
                    }
                }
            }
        }
        freeifaddrs(ifaddr)
    }

    resolve(en0Address ?? en1Address ?? en2Address ?? "0.0.0.0")
  }
}
