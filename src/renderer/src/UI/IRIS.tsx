import Sphere from '@renderer/components/Sphere'

const IRIS = () => {
  return (
    <>
      <div className="h-screen w-full bg-black">
        <div className="h-full w-full">
          <div className="absolute top-14 flex items-center justify-center w-full">
            <h1 className="text-white text-center text-7xl">IRIS AI</h1>
          </div>
          <Sphere />
          <div className="bg-green-200 h-44 w-full absolute bottom-14"></div>
        </div>
      </div>
    </>
  )
}

export default IRIS
