// Simple Dependency Injection container to manage singleton service layers

const services = {};

const register = (name, instance) => {
  services[name] = instance;
};

const resolve = (name) => {
  if (!services[name]) {
    throw new Error(`Service '${name}' is not registered in the DI container.`);
  }
  return services[name];
};

const clear = () => {
  Object.keys(services).forEach(key => delete services[key]);
};

module.exports = {
  register,
  resolve,
  clear
};
