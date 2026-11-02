export type ThemePreference='system'|'light'|'dark';
export function themePreference(value:unknown):ThemePreference{return value==='light'||value==='dark'?value:'system'}
export function resolvedTheme(preference:ThemePreference,systemDark:boolean):'light'|'dark'{return preference==='system'?(systemDark?'dark':'light'):preference}
