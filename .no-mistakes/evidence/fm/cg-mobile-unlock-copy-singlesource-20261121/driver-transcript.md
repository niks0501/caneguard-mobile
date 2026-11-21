# Web validation drive log (revision 558b828e8608)

Environment: `CANEGUARD_WEB_VALIDATE_TODAY=2026-11-01 npm run web:validate` from the worktree
(stub API http://127.0.0.1:8210, Expo web dev server http://127.0.0.1:8199), driven by
`chrome-devtools-axi` (Chrome DevTools bridge) at a 420x900 viewport, one browser profile per origin.

Device route: `npm run live:up -- --exit-after-ready` -> DEVICE_UNAVAILABLE
(adb devices: none listed). No native target, so no agent-device transcript exists for this run.

Commands, in order (snapshot refs omitted; refs re-read before every action):

1. open http://127.0.0.1:8199/login                        -> /login, "Password-only sign-in: ... Turn on biometric unlock in Account security ..."
   screenshot 01-login-offline-note-en.png
2. fillform Email=inspector@validation.invalid Password=validation-only ; click "Login to CaneGuard"
   -> /home, readiness line "Not ready for offline work. Turn on biometric unlock."
   screenshot 02-home-readiness-line-inspector-en.png
3. click "Open settings"                                  -> /settings, Field readiness card
   screenshot 03-settings-readiness-card-inspector-en.png
4. click "Account and security"                           -> /account-security
   observed "Biometric unlock", "Enable biometric unlock", "Session expires Dec 21, 2026, 7:23 PM. Biometric unlock does not extend it."
   screenshot 04-account-security-inspector-en.png
5. back; click "Log out of your account"; click "Log out" -> /login
6. fillform Email=farmer@validation.invalid Password=validation-only ; click "Login to CaneGuard"
   -> /home in Tagalog, screenshot 05-home-farmer-tl.png
7. click "Mga setting" -> /settings ; click "Seguridad ng account" -> /account-security
   observed "Pagbukas gamit ang biometrics" / "I-on ang pagbukas gamit ang biometrics" /
   "Mag-e-expire ang session sa Dec 21, 2026, 7:25 PM. Hindi ito pinahahaba ng pagbukas gamit ang biometrics."
   screenshot 06-account-security-farmer-tl.png
8. back -> /settings ; click language radio "Ingles" -> settings flips to English
   screenshot 07-settings-farmer-switched-en.png
9. click "Account security" -> /account-security, English wording from the same owner
   screenshot 08-account-security-farmer-en.png
