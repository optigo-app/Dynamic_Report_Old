// const storeInit = JSON.parse(sessionStorage.getItem("storeInit"));

// const config = {
//   di: 'orail25',
//   En_ufcc: 'orail25',
//   En_UI: '15864',
//   En_UN: 'shreon prakash',
//   En_UC: 'shreon',
//   En_IMP: 'http://nzen/R50B3/UFS/ufs2/orail228FT0OWNGEI6DC3BVS//CustomerImages/',
//   address: 'http://nzen/optiogo-backend',
//   SoPath: '/connect_socket_react/socket.io',
//   iTaskCallBackURL: ''
// };

// export default config;



// const config = {
//   di: "orail25", //storeinit.ufcc
//   // En_ufcc: 'orail24',
//   // En_UI: '15864',
//   // En_UN: 'shreon prakash',
//   // En_UC: 'shreon',
//   // En_IMP: 'http://nzen/R50B3/UFS/ufs2/orail228FT0OWNGEI6DC3BVS//CustomerImages/',
//   address: "http://nzen/optigo-backend", //storeinit.soket_address
//   SoPath: "/connect_socket_react/socket.io", //storeini.soket_path
//   // iTaskCallBackURL: ''
// };
// export default config;


// const storeInit = JSON.parse(sessionStorage.getItem("soketVariable")) ?? [];
// console.log('storeInitstoreInitstoreInit', storeInit);
// const config = {
//   di: `${storeInit[0]?.Ufcc}` ?? '', //storeinit.ufcc
//   // En_ufcc: 'orail24',
//   // En_UI: '15864',
//   // En_UN: 'shreon prakash',
//   // En_UC: 'shreon',
//   // En_IMP: 'http://nzen/R50B3/UFS/ufs2/orail228FT0OWNGEI6DC3BVS//CustomerImages/',
//   address: `${storeInit[0]?.Socket_URL}` ?? '', //storeinit.soket_address
//   SoPath: `${storeInit[0]?.Socket_Path}` ?? '' //storeini.soket_path
//   // iTaskCallBackURL: ''
// };
// export default config;
// socketConfig.js (replace previous config.js)

export const getSocketConfig = () => {
  const storeInit = JSON.parse(sessionStorage.getItem("soketVariable")) ?? [];

  return {
    di: storeInit[0]?.Ufcc ?? '',
    address: storeInit[0]?.Socket_URL ?? '',
    SoPath: storeInit[0]?.Socket_Path ?? '',
  };
};



// // "Ufcc": "orail25",
// // "Socket_URL": "http://nzen/connect_socket",
// // "Socket_Address": "http://nzen",
// // "Socket_Path": "/connect_socket/socket.io"
