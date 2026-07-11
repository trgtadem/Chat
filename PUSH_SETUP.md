# Push / Cloud Functions

## Spark (ucretsiz) — PRIMARY yol
Istemci `notifyUser` + Expo Push + EAS FCM V1.
Cloud Function Blaze ister; Spark'ta **kullanilmaz**. `onMessageCreated` deploy edilmeden acma.

Sessize alinan sohbetler: `users/{uid}/mutedChats/{friendId}` — gonderen `notifyUser` oncesi okur ve atlar.

## Kontrol listesi
1. EAS'te FCM V1 yuklu (yaptin)
2. `google-services.json` + `POST_NOTIFICATIONS` (repo'da var)
3. **Yeni native build** al (FCM / google-services degisikligi eski APK'da yok)
4. Iki fiziksel cihaz, her ikisinde Firestore `pushToken` dolu
5. Metro log: `Push: token OK` ve `Push: ticket OK`
6. Tek telefonda iki hesap → ayni token, bildirim atlanir (bilerek)

## Service account
`*-firebase-adminsdk-*.json` sadece EAS'e yuklenir, **git'e koyma** (.gitignore'da).

## Blaze sonrasi (opsiyonel)
`firebase deploy --only functions` → sonra messaging'den istemci `notifyUser` kaldir (cift gonderim olmasin).
