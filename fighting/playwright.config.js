import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', timeout:45000, workers:1,
  use:{baseURL:'http://127.0.0.1:5173',viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true,
    launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']},screenshot:'only-on-failure',trace:'retain-on-failure'},
});
