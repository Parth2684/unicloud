"use client";
import { BACKEND_URL } from "@/lib/export";
import { HomeComponent } from "../../../components/HomeComponent";
import { useUserStore } from "../../../stores/user/useUserStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { setUserInfo, userInfo } = useUserStore();
  const router = useRouter();
  useEffect(() => {
    const setInfo = async () => await setUserInfo();
    setInfo();
  }, []);
  return (
    <div>
      <div className="m-5 flex justify-between items-center">
        <a
          href={`${BACKEND_URL}/auth/drive`}
          className="text-lg border border-stone-700 rounded-2xl p-2.5"
        >
          Add Google Drive
        </a>

        {/* Profile */}
        <h1 className='text-2xl text-center font-bold'>unicloud</h1>
        <div
          className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-sm font-medium text-gray-700"
          onClick={() => {
            router.push("/info");
          }}
        >
          {userInfo?.image ? (
            <img
              src={userInfo.image}
              alt="profile"
              className="h-full w-full object-cover cursor-pointer"
            />
          ) : (
            userInfo?.gmail?.charAt(0).toUpperCase()
          )}
        </div>
      </div>
      <hr></hr>
      <HomeComponent />
    </div>
  );
}
