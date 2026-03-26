<div align="center">
  <h1>📦 HomeStock</h1>
  <p><strong>แอปพลิเคชันจัดการสต็อกสิ่งของในบ้านและเช็คราคาสำหรับครอบครัวยุคใหม่</strong></p>

  <p>
    <img alt="Platform" src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue.svg">
    <img alt="Framework" src="https://img.shields.io/badge/Framework-React%20Native%20%2F%20Expo-black.svg?logo=expo">
    <img alt="Backend" src="https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg?logo=supabase">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg">
  </p>
</div>

---

## 📖 เกี่ยวกับโปรเจ็กต์

**HomeStock** เป็นแอปพลิเคชันบนมือถือที่ออกแบบมาเพื่อช่วยให้สมาชิกในครอบครัวจัดการสต็อกสิ่งของภายในบ้านได้อย่างง่ายดาย ไม่ว่าคุณจะต้องการติดตามของใช้ในบ้าน เช็คราคาสินค้าล่าสุด หรือจัดการสมาชิกในครอบครัว HomeStock จะช่วยให้ประสบการณ์เหล่านี้ราบรื่นและใช้งานง่ายที่สุด

แอปนี้ถูกพัฒนาด้วยเทคโนโลยีสมัยใหม่อย่าง React Native (ผ่านระบบจัดการแบบ Expo Router) ขับเคลื่อนระบบฐานข้อมูลและยืนยันตัวตนด้วยบัญชีผู้ใช้ที่ปลอดภัยผ่านระบบอย่าง Supabase

### ✨ ฟีเจอร์หลัก

- **👨‍👩‍👧‍👦 ระบบครอบครัว (Family Management):** สร้างกลุ่มครอบครัว และเชิญสมาชิกใหม่เข้าร่วมได้อย่างง่ายดายผ่านรหัส 5 หลัก
- **📦 จัดการสต็อกสินค้า (Inventory Tracker):** เพิ่มหรือลดสินค้าในสต็อกได้อย่างรวดเร็วผ่านการสแกนบาร์โค้ด
- **💰 ระบบเช็คราคา (Price Checker):** ตรวจสอบราคาสินค้าได้อย่างรวดเร็วและใช้ในการวางแผนตอนซื้อของ
- **🔐 ระบบรักษาความปลอดภัย (Secure Authentication):** เข้าสู่ระบบอย่างปลอดภัยและปกป้องข้อมูลของคุณด้วยเบื้องหลังอย่าง Supabase
- **🔔 การแจ้งเตือนอัจฉริยะ (Smart Notifications):** อัปเดตข้อมูลจำนวนสต็อกสินค้าและความเคลื่อนไหวต่างๆ ของคนในครอบครัว
- **📱 รองรับหลายแพลตฟอร์ม (Cross-Platform):** หน้าจอ UI สวยงามและตอบสนองได้ดี ทั้งบนระบบปฏิบัติการ iOS และ Android



## 🛠️ เครื่องมือที่ใช้พัฒนา (Built With)

- **[Expo](https://expo.dev/)** - เฟรมเวิร์กสำหรับสร้าง React Native.
- **[React Navigation / Expo Router](https://docs.expo.dev/router/introduction/)** - ระบบนำทาง (Routing and navigation) แบบอิงตามไฟล์.
- **[Supabase](https://supabase.com/)** - ระบบใช้งานแทน Firebase เป็นฐานข้อมูลและระบบล็อกอิน
- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** - ตัวช่วยเพื่อสร้างแอนิเมชัน UI ที่ลื่นไหล.
- **[Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)** - ระบบแสกนบาร์โค้ดสำหรับอ่านสิ่งของ.

## 🚀 เริ่มต้นการใช้งาน (Getting Started)

ทำตามขั้นตอนด้านล่างนี้เพื่อรันโปรเจ็กต์ลงบนเครื่องคอมพิวเตอร์ของคุณ

### สิ่งที่ต้องมี (Prerequisites)

- Node.js (แนะนำให้ใช้ v18 หรือใหม่กว่า)
- `npm` หรือ `yarn`
- แพลตฟอร์ม Expo CLI หรือมีแอป Expo Go บนมือถือของคุณ

### การติดตั้ง (Installation)

1. **Clone repository นี้**
   ```bash
   git clone https://github.com/your-username/rn-homestock-app.git
   cd rn-homestock-app
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   สร้างไฟล์ `.env.local` ในไดเรกทอรีหลักของโปรเจกต์ (Root) และเพิ่มข้อมูล Supabase credentials ตามตัวอย่างนี้:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **เริ่มรัน Development server**
   ```bash
   npx expo start
   ```

5. **รันแอปพลิเคชัน**
   - กดปุ่ม `i` บนคีย์บอร์ดเพื่อเปิดขึ้นมาใน iOS simulator
   - กดปุ่ม `a` บนคีย์บอร์ดเพื่อเปิดขึ้นมาใน Android emulator
   - หรือ สแกน QR Code ในหน้า Terminal โดยใช้แอป **Expo Go** บนโทรศัพท์มือถือเครื่องจริงของคุณ

## 📁 โครงสร้างโปรเจ็กต์เบื้องต้น (Project Structure)

```text
rn-homestock-app/
├── app/               # หน้าจอของแอปพลิเคชัน จัดแบบ Expo Router
│   ├── (auth)/        # หน้าจอสำหรับการยืนยันตัวตน เช่น เข้าสู่ระบบ
│   ├── (tabs)/        # หน้าจอหลักที่ใช้งานเมนูแท็บด้านล่างแอป
│   ├── check-price.tsx# หน้าสำหรับตรวจสอบราคาสินค้า
│   ├── join-family.tsx# หน้าสำหรับเข้าร่วมกลุ่มครอบครัวผ่านรหัส
│   └── scan-in.tsx    # หน้าสำหรับระบบสแกนบาร์โค้ดเพื่อนำของเข้า
├── assets/            # แหล่งจัดเก็บรูปภาพ ไอคอน ดีไซน์ ฟอนต์ต่างๆ
├── components/        # ส่วนประกอบ UI (โค้ดที่สามารถเรียกใช้งานซ้ำได้เรื่อยๆ)
├── constants/         # โค้ดที่เก็บตั้งค่า สี และค่าคงที่ต่างๆ อ้างอิงได้ทั่วทั้งแอป
└── utils/             # ฟังก์ชันตัวช่วย (Helper utilities) ต่างๆ ของระบบ
```




