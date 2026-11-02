import {test} from 'node:test';
import assert from 'node:assert/strict';
import {themePreference,resolvedTheme} from '../src/theme.ts';
test('theme defaults to system and explicit preferences override the system',()=>{
 assert.equal(themePreference(null),'system');assert.equal(themePreference('bogus'),'system');
 assert.equal(resolvedTheme('system',true),'dark');assert.equal(resolvedTheme('system',false),'light');
 assert.equal(resolvedTheme('light',true),'light');assert.equal(resolvedTheme('dark',false),'dark');
 assert.equal(themePreference('dark'),'dark');assert.equal(themePreference('light'),'light');
});
