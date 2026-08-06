import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "./firebase";


export default function AdminMessages(){

const [messages,setMessages]=useState([]);


useEffect(()=>{

async function getMessages(){

const q=query(
collection(db,"messages"),
orderBy("createdAt","desc")
);


const snap=await getDocs(q);


setMessages(
snap.docs.map(doc=>({
id:doc.id,
...doc.data()
}))
);


}

getMessages();

},[]);



return (

<div className="p-6">

<h1 className="text-2xl font-bold mb-5">
Messages
</h1>


{
messages.map((msg)=>(

<div
key={msg.id}
className="p-4 mb-4 rounded-xl border"
>

<h3>
{msg.name}
</h3>

<p>
{msg.email}
</p>

<p>
{msg.type}
</p>

<p>
{msg.message}
</p>

</div>

))
}


</div>

);

}