import ws from 'ws';

describe('websocket', function() {
  it('connect to ws', async function() {
    const client = new ws('ws://localhost:6969')

    client.on('open', () => {
        client.send('Hello')
    })
  });
});
