# Chinese Mission Game

เว็บแอป/PWA ฝึกภาษาจีน HSK 1 ผ่านภารกิจจำลองสถานการณ์: เรียนคำศัพท์ → ต่อประโยคจาก tiles → รับ feedback → เก็บ MMR → ปลดล็อกบทถัดไป

## ตอนนี้ทำอะไรได้แล้ว

- 10 ภารกิจ HSK 1 แยกเป็นบท พร้อมคำศัพท์ พินอิน คำแปล ตัวอย่าง และไวยากรณ์
- Dashboard แบบเกม: MMR, level, streak และความคืบหน้า
- หน้า Vocabulary ที่เปิดรายละเอียด ทำเครื่องหมาย และฟังเสียง `zh-CN` ผ่าน Web Speech API
- Scenario chat พร้อมคำลวง, tile info, hint พินอิน/คำแปล และ feedback ถูก/ผิด
- กติกาคะแนนตาม brief: ตอบถูกครั้งแรก +12, หลังลองใหม่ +5, ผิด -6, hint -2/-5, จบบท +30 และโบนัสความแม่นยำ
- ปลดล็อกบทตามลำดับ และ PWA installable
- Google Sign-In + Firestore sync เมื่อใส่ Firebase config
- Demo Mode สำหรับพัฒนา local โดยไม่ต้องมี cloud credentials
- Callable Cloud Function สำหรับ Gemini โดยเก็บ API key ใน Firebase Secret เท่านั้น
- Firestore security rules ที่ให้ผู้ใช้เข้าถึงข้อมูลของ `uid` ตัวเอง

## รัน local

ต้องมี Node.js 20 ขึ้นไป

```bash
npm install
npm run dev
```

เปิด `http://127.0.0.1:5173` แล้วกด **ทดลองเล่น Demo** ได้ทันที โดย Demo Mode เก็บความคืบหน้าใน `sessionStorage` เพื่อการทดสอบเท่านั้น ไม่ใช่ data source ของ production

ตรวจคุณภาพก่อน deploy:

```bash
npm run build
npm test
npm --prefix functions install
npm run functions:build
```

## ตั้ง Firebase ด้วย account ส่วนตัว

1. สร้าง Firebase project ใน [Firebase Console](https://console.firebase.google.com/) ด้วย Google account ส่วนตัว
2. เพิ่ม Web App แล้วเปิด Authentication → Sign-in method → Google
3. สร้าง Firestore database เลือก region ใกล้ผู้ใช้ เช่น `asia-southeast1`
4. คัดลอก `.env.example` เป็น `.env.local` และใส่ค่า Web App config (ค่าเหล่านี้เป็น client identifiers ไม่ใช่ Gemini secret)
5. คัดลอก `.firebaserc.example` เป็น `.firebaserc` แล้วใส่ project ID
6. ติดตั้ง Firebase CLI และ login ด้วย account ส่วนตัว

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_PERSONAL_FIREBASE_PROJECT_ID
```

7. สร้าง Gemini API key ใน Google AI Studio แล้วบันทึกเป็น Functions secret — ห้ามใส่ใน `.env.local` หรือ commit

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

8. ทดสอบ emulator ก่อน deploy

```bash
firebase emulators:start
```

จากนั้นตั้ง `VITE_USE_FIREBASE_EMULATORS=true` ใน `.env.local` แล้วรัน `npm run dev` อีก terminal

9. Deploy เมื่อ local ผ่านแล้ว

```bash
npm run build
firebase deploy --only firestore:rules,functions,hosting
```

## เรื่องค่าใช้จ่าย (สำคัญ)

- Firebase Spark ใช้ Authentication, Hosting และ Firestore ได้โดยไม่ต้องใส่วิธีชำระเงินภายในโควตาฟรี ดู [Firebase pricing](https://firebase.google.com/pricing)
- การ deploy Cloud Functions ต้องใช้ Blaze plan ตาม [คู่มือ Firebase Functions](https://firebase.google.com/docs/functions/get-started) แม้การเรียกใช้งานขนาดเล็กจะมี no-cost quota การผูก billing จึงยังจำเป็น และ container storage อาจมีค่าใช้จ่ายเล็กน้อย
- Gemini API มี free tier แต่ rate limit เปลี่ยนได้ตาม model/project ดูค่าปัจจุบันใน [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

ถ้าต้องการ **ไม่ผูกบัตรเลย** ให้ deploy เฉพาะ Hosting/Auth/Firestore บน Spark และใช้บทสนทนาแบบ deterministic ที่มีอยู่ในแอปก่อน ส่วน AI server สามารถย้ายไป provider ที่มี serverless free tier ภายหลังได้ โดย frontend contract ใน `src/services/ai.ts` แยกไว้แล้ว

## สถาปัตยกรรมและความปลอดภัย

```text
React PWA
  ├─ Firebase Authentication (Google)
  ├─ Firestore (profile, MMR, lesson progress)
  └─ Callable Cloud Function
       └─ Gemini API (GEMINI_API_KEY in Secret Manager)
```

- `.env`, `.env.local`, build output และ function secrets ถูก ignore
- frontend ไม่มี Gemini key
- Firestore rules จำกัด `users/{uid}` และ subcollections ตาม authenticated `uid`
- lesson content อยู่ใน source control เพื่อให้ clone แล้ว build ได้ทันที ส่วนข้อมูลผู้ใช้ production อยู่ใน Firestore
- ใช้ App Check ก่อนเปิดให้คนภายนอกจำนวนมาก (`enforceAppCheck` ยังเป็น `false` ใน MVP เพื่อให้ setup local ง่าย)

## โครงสร้างหลัก

```text
src/data/lessons.ts          เนื้อหา 10 บทและ mock conversation
src/state/GameContext.tsx    Auth, profile และ cloud/demo persistence
src/services/firebase.ts     Firebase + emulator configuration
src/services/ai.ts           Typed callable client
src/utils/scoring.ts         Local fast validation และ scoring
functions/src/index.ts       Gemini tutor/semantic validation endpoint
firestore.rules              กฎความปลอดภัย
firebase.json                Hosting, Firestore, Functions, emulators
```

## สิ่งที่ต้องทำต่อหลังเชื่อม account

- Seed lesson content เข้า Firestore และเปลี่ยน lesson service ให้โหลด cloud-first
- ต่อหน้า mission เข้ากับ `aiTutor` หลังผ่าน local deterministic flow
- บันทึก session/turn และ word mastery ลง subcollections
- เปิด App Check และกำหนด budget alert ก่อนใช้ Blaze
- เพิ่ม speech-to-text/pronunciation scoring ใน phase ถัดไป
