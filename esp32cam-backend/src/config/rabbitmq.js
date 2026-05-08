const rabbitmqConfig = {
  host: process.env.RABBITMQ_HOST || 'rabbit-mq.sta.my.id',
  user: process.env.RABBITMQ_USER || 'smartparking',
  password: process.env.RABBITMQ_PASSWORD || 'mSmrtp4rk!n9',
  vhost: process.env.RABBITMQ_VHOST || '/smartparking',
  queue: process.env.RABBITMQ_QUEUE || 'camera.matlab',

  get url() {
    const encodedVhost = encodeURIComponent(this.vhost);
    return `amqp://${this.user}:${this.password}@${this.host}/${encodedVhost}`;
  },

  options: {
    heartbeat: 60,
    reconnectDelay: 5000,
  },
};

module.exports = rabbitmqConfig;
