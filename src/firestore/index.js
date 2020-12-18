import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ4mR4-RGtG08m3R1NV_RUqoQg3rtLHEM",
  authDomain: "shopsharer-211ec.firebaseapp.com",
  projectId: "shopsharer-211ec",
  storageBucket: "shopsharer-211ec.appspot.com",
  messagingSenderId: "274151552403",
  appId: "1:274151552403:web:680b08e5a311792f796466",
};

const firebaseApp = !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();
const storage = firebaseApp.storage();

export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
}

export function checkAuth(cb) {
  return auth.onAuthStateChanged(cb);
}

export async function logOut() {
  await auth.signOut();
}

export async function getCollection(id) {
  const snapshot = await db.collection(id).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getUserLists(userId) {
  const snapshot = await db
    .collection("lists")
    .where("userIds", "array-contains", userId)
    // .where("author", "==", userId)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

function uploadCoverImage(file) {
  const fileName = `${file.name}-${file.lastModified}`;

  const uploadTask = storage.ref(`images/${fileName}`).put(file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => console.log("image uploading", snapshot),
      reject,
      () => {
        storage.ref("images").child(fileName).getDownloadURL().then(resolve);
      }
    );
  });
}

export async function createList(list, user) {
  const { name, description, image } = list;
  await db.collection("lists").add({
    name,
    description,
    image: image ? await uploadCoverImage(image) : null,
    created: firebase.firestore.FieldValue.serverTimestamp(),
    author: user.uid,
    userIds: [user.uid],
    users: [
      {
        id: user.uid,
        name: user.displayName,
      },
    ],
  });
}

export async function getList(listId) {
  try {
    const list = await db.collection("lists").doc(listId).get();
    if (!list.exists) throw Error("List doesn't exist");
    return list.data();
  } catch (error) {
    throw Error(error);
  }
}

export async function createListItem({ user, listId, item }) {
  try {
    const response = await fetch(
      `https://screenshotapi.net/api/v1/screenshot?url=${item.link}&token=QISMRCKZLOWM1A0HXZLMNVB8JP8YYIPI`
    );
    const { screenshot } = await response.json();
    db.collection("lists")
      .doc(listId)
      .collection("items")
      .add({
        name: item.name,
        link: item.link,
        image: screenshot,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        author: {
          id: user.uid,
          username: user.displayName,
        },
      });
  } catch (error) {
    throw new Error(error);
  }
}

export function suscribeToListItems(listId, cb) {
  return db
    .collection("lists")
    .doc(listId)
    .collection("items")
    .orderBy("created", "desc")
    .onSnapshot(cb);
}

// We do not need to mkae this funcion async since the suscription above keeps listening for changes
export function deleteListItem(listId, itemId) {
  return db
    .collection("lists")
    .doc(listId)
    .collection("items")
    .doc(itemId)
    .delete();
}

export async function addUserToList(user, listId) {
  await db
    .collection("lists")
    .doc(listId)
    .update({
      userIds: firebase.firestore.FieldValue.arrayUnion(user.uid),
      users: firebase.firestore.FieldValue.arrayUnion({
        id: user.uid,
        name: user.displayName,
      }),
    });
}
