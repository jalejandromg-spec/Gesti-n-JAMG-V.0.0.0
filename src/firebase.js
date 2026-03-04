import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDx8oOQa26Fnt19o8x1jpKRvNfUK8NL8zw",
  authDomain: "gestion-jamg.firebaseapp.com",
  projectId: "gestion-jamg",
  storageBucket: "gestion-jamg.firebasestorage.app",
  messagingSenderId: "42178176857",
  appId: "1:42178176857:web:c475f3fa41c84c52f3ce48"
};

// Inicializamos Firebase con tus llaves
const app = initializeApp(firebaseConfig);

// Inicializamos la Base de Datos (Firestore) y la exportamos para usarla en la app
export const db = getFirestore(app);