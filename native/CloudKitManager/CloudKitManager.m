// CloudKitManagerBridge.m
#ifdef WITH_ICLOUD
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CloudKitManager, NSObject)
  RCT_EXTERN_METHOD(getUserRecordID: (RCTPromiseResolveBlock)resolve rejecter: (RCTPromiseRejectBlock)reject)
@end
#endif
