# MyGameApp

"MyGameApp", arkadaşlarınızla gerçek zamanlı mesajlaşmanızı sağlayan modern bir mobil sohbet uygulamasıdır. Kullanıcıların birbirleriyle kolayca iletişim kurmasını, çevrimiçi durumlarını görmesini ve anlık bildirimler almasını sağlayan zengin özelliklere sahiptir.

## Özellikler

*   **Gerçek Zamanlı Mesajlaşma:** Firebase Firestore kullanarak anlık mesaj alışverişi.
*   **Kullanıcı Kimlik Doğrulaması:** Firebase Authentication ile güvenli kullanıcı girişi ve kaydı.
*   **Kullanıcı Durumu:** Kullanıcıların çevrimiçi/çevrimdışı durumlarını ve son görülme bilgilerini görüntüleme.
*   **Push Bildirimleri:** Yeni mesajlar için anlık bildirimler alma.
*   **Sohbet Listesi:** Kullanıcıların mevcut sohbetlerini ve yeni kişilerle sohbet başlatma yeteneğini yönetme.
*   **Mesaj Okundu Bilgisi:** Gönderilen mesajların durumunu (gönderildi, okundu) görme.
*   **Kullanıcı Arayüzü:** Temiz ve sezgisel bir kullanıcı deneyimi sağlayan modern tasarım.

## Teknolojiler

*   **React Native:** Mobil uygulama geliştirme framework'ü.
*   **Expo:** React Native projelerini daha hızlı geliştirmek ve dağıtmak için bir platform.
*   **Firebase Firestore:** Gerçek zamanlı veritabanı.
*   **Firebase Authentication:** Kullanıcı kimlik doğrulama servisi.
*   **Expo Notifications:** Push bildirimleri entegrasyonu.
*   **Lucide React Native:** Vektör ikon seti.
*   **TypeScript:** Daha güvenli ve ölçeklenebilir kod yazmak için.

## Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/KULLANICI_ADINIZ/MyGameApp.git
    cd MyGameApp
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```
    `dotenv` paketinin yüklenmemiş olabileceğini unutmayın. `npm install dotenv` veya `yarn add dotenv` ile manuel olarak yüklemeniz gerekebilir.

3.  **Firebase Projesi Oluşturun:**
    *   [Firebase Console](https://console.firebase.google.com/) adresine gidin ve yeni bir proje oluşturun.
    *   Projenize bir web uygulaması ekleyin ve yapılandırma bilgilerinizi alın.
    *   Firestore veritabanını başlatın (test modunda veya üretim modunda).
    *   Kimlik Doğrulama yöntemlerini (örneğin E-posta/Şifre) etkinleştirin.

4.  **Ortam Değişkenlerini Ayarlayın:**
    *   Proje kök dizininde `.env` adında bir dosya oluşturun.
    *   `firebaseConfig.ts` dosyasından veya Firebase Konsolunuzdan aldığınız yapılandırma bilgilerini bu dosyaya aşağıdaki formatta yapıştırın:
        ```
        EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
        EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
        EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
        EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
        EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
        EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
        ```
    *   `YOUR_FIREBASE_...` kısımlarını kendi Firebase proje bilgilerinizle değiştirin.

5.  **Firebase Güvenlik Kurallarını Ayarlayın:**
    *   `firestore.rules` dosyasındaki kuralları Firebase Firestore güvenlik kurallarına kopyalayın. Bu kurallar, uygulamanızın güvenli bir şekilde çalışması için gerekli okuma/yazma izinlerini sağlar.

## Çalıştırma

Tüm kurulum adımlarını tamamladıktan sonra, uygulamayı başlatmak için:

```bash
npm start
# veya
yarn start
```
Bu komut, Expo geliştirme sunucusunu başlatır. Uygulamayı Expo Go uygulamasıyla telefonunuzda veya bir emülatörde açmak için QR kodunu tarayabilirsiniz.

## Ekran Görüntüleri / GIF

Uygulamanın nasıl göründüğünü göstermek için buraya birkaç ekran görüntüsü veya kısa bir GIF ekleyebilirsiniz.

## Katkıda Bulunma

Katkılarınız her zaman açığız! Herhangi bir hata bulursanız veya yeni bir özellik önermek isterseniz, lütfen bir "issue" açın veya bir "pull request" gönderin.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın (eğer varsa).

---
**Not:** `KULLANICI_ADINIZ` kısmını GitHub kullanıcı adınızla değiştirmeyi unutmayın.