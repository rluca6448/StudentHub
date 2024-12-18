import Pusher from 'pusher';

// Configurar Pusher
const pusher = new Pusher({
    appId: '1887717',
    key: '6425bcb0832cd871505e',
    secret: '0662f30cb24ab2d55987',
    cluster: 'sa1',
    encrypted: true
  });

  export { pusher }