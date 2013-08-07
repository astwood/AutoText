//
//  HelloManager.h
//  AutoText
//
//  Created by Ma Hai Feng on 8/5/13.
//
//

#ifndef AutoText_HelloManager_h
#define AutoText_HelloManager_h



#endif

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface HelloManager : CDVPlugin

@property (nonatomic, copy) NSString* callbackID;

// Instance Method
- (void) print:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end