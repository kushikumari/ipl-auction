import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { AuctionTransaction } from "@/types";

export const getTransaction = async (id: string) => {
  const docRef = doc(db, "transactions", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as AuctionTransaction) : null;
};

export const createTransaction = async (transaction: AuctionTransaction) => {
  await setDoc(doc(db, "transactions", transaction.id), transaction);
};

export const subscribeToTransactions = (callback: (txs: AuctionTransaction[]) => void) => {
  const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as AuctionTransaction));
  });
};
