import {Tabs, useFocusEffect} from 'expo-router';
import React, {useCallback, useEffect} from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import {appendLog} from "@/app/store/log";
import {NativeEventEmitter, NativeModules, useColorScheme} from "react-native";
import {useAppDispatch, useAppSelector} from "@/app/store";
import {refreshIsRunning} from "@/app/store/server";
import useAppInActive from "@/hooks/useAppInActive";
import axios from "axios";

const {Alist, HCKeepBGRunManager} = NativeModules;
const eventEmitter = new NativeEventEmitter(Alist);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const backgroundMode = useAppSelector(state => state.setting.backgroundMode)
  const autoStopHours = useAppSelector(state => state.setting.autoStopHours) || 0
  const isRunning = useAppSelector(state => state.server.isRunning)
  const appInActive = useAppInActive()

  const checkIsRunning = useCallback(async () => {
    try {
      await axios.get('http://127.0.0.1:5244/ping', {
        timeout: 1000
      })
      console.log('检查服务：可用')
    } catch (e) {
      console.log('检查服务：不可用')
      // 如果服务实际上不可用，则自动关闭，更新状态
      await Alist.stop()
      dispatch(refreshIsRunning())
    }
  }, [])

  useEffect(() => {
    const onLog = eventEmitter.addListener('onLog', (logInfo) => {
      dispatch(appendLog(logInfo))
    });
    const onProcessExit = eventEmitter.addListener('onProcessExit', (logInfo) => {
      console.log('onProcessExit', logInfo)
      dispatch(refreshIsRunning())
    });
    const onShutdown = eventEmitter.addListener('onShutdown', (logInfo) => {
      console.log('onShutdown', logInfo)
      dispatch(refreshIsRunning())
      HCKeepBGRunManager.stopBGRun()
    });
    const onStartError = eventEmitter.addListener('onStartError', (logInfo) => {
      console.log('onStartError', logInfo)
      dispatch(refreshIsRunning())
    });

    return () => {
      onLog.remove();
      onProcessExit.remove();
      onShutdown.remove();
      onStartError.remove();
    }
  }, [])

  useFocusEffect(useCallback(() => {
    dispatch(refreshIsRunning())
  }, [appInActive]));

  useEffect(() => {
    if (backgroundMode && isRunning) {
      if (appInActive) {
        HCKeepBGRunManager.stopBGRun()
      } else {
        HCKeepBGRunManager.startBGRun()
      }
    }
  }, [appInActive, backgroundMode, isRunning])

  useEffect(() => {
    if (appInActive && isRunning) {
      // 切到前台时，如果服务处于运行状态，通过接口再检测一下服务是否可用，防止服务进程被系统杀掉
      checkIsRunning()
    }
  }, [appInActive, isRunning, checkIsRunning]);

  useEffect(() => {
    Alist.setAutoStopHours(autoStopHours)
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].headerBackgroundColor,
        },
        headerTitleStyle: {
          fontSize: 20,
        },
        headerTintColor: 'white',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: 'AList',
          title: '首页',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: '浏览',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'folder' : 'folder-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: '管理',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'layers' : 'layers-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: '日志',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'reader' : 'reader-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: '设置',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
