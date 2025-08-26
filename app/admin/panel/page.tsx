import Image from "next/image";

export default function AdminPanelHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full text-center">
      <Image
        src="/Company-logo-svg.svg"
        alt="Propelligence Logo"
        width={96}
        height={96}
        className="w-24 h-24 rounded-2xl object-contain drop-shadow-xl mb-2"
        priority
        draggable={false}
      />
      <h1 className="text-4xl md:text-5xl font-extrabold text-[#022d58] mb-2 leading-tight">
        Welcome to Admin Dashboard
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
        Your interface to control everything about the website.
      </p>
    </div>
  );
}
