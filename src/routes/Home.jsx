import React from "react";
import logo from "../assets/pig-0.png";
import { Link } from "react-router-dom";
import SoundSwitch from "src/components/SoundSwitch";

export default function Home() {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center items-center">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <SoundSwitch />
      </div>
      <figure>
        <img src={logo} alt="" width={400} />
      </figure>
      <div className="flex flex-col gap-8 text-[#F9F7E8] text-center">
        <h1 className="pri-font text-3xl sm:text-5xl lg:text-6xl ">
          Greedy Pig
        </h1>
        <div className="flex gap-4 flex-col">
          {/* <Link
            to={`/play-computer`}
            className=" sec-font text-xl rounded px-8 py-4 bg-[#d30cbcc0] font-bold duration-500 skew-x-6 hover:skew-x-0 hover:scale-95 hover:bg-[#d30cbc] "
          >
            Play Computer
          </Link>
          <Link
            to={`/play-remote-game`}
            className=" sec-font text-xl rounded px-8 py-4 bg-[#d30cbcc0] font-bold duration-500 -skew-x-6 hover:bg-[#d30cbc] hover:skew-x-0 hover:scale-95  "
          >
            Play Friends (Remote)
          </Link> */}
          <Link
            to={`/live-game/setup`}
            className=" sec-font text-xl rounded px-8 py-4 bg-[#d30cbcc0] font-bold duration-500 skew-x-6 hover:bg-[#d30cbc] hover:skew-x-0 hover:scale-95 "
          >
            Play Friends (Live)
          </Link>
          <Link
            to={`/history`}
            className=" sec-font text-xl rounded px-8 py-4 bg-[#056FA4c0] font-bold duration-500 -skew-x-6 hover:bg-[#056FA4] hover:skew-x-0 hover:scale-95 "
          >
            Match History
          </Link>
        </div>
      </div>
    </section>
  );
}
