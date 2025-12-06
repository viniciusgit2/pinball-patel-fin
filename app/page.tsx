export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white mb-4 drop-shadow-2xl animate-pulse">
          🎯 PINBALL GAME
        </h1>
        <p className="text-2xl text-white mb-8 opacity-90">
          Versão 2.0.0
        </p>
        <a
          href="/pinball"
          className="inline-block bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white text-2xl font-bold py-4 px-12 rounded-full hover:scale-110 transition-transform shadow-2xl"
        >
          JOGAR AGORA! 🚀
        </a>
        
        <div className="mt-12 text-white text-lg opacity-75 max-w-md mx-auto">
          <p className="mb-4">
            Um jogo de pinball clássico com física realista!
          </p>
          <ul className="text-left space-y-2">
            <li>⚡ Bolas com física realista</li>
            <li>🎯 Alvos e bumpers que dão pontos</li>
            <li>🎮 Controles responsivos</li>
            <li>🏆 Sistema de pontuação e recordes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
