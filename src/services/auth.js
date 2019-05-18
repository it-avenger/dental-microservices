class Auth {
  login(username, password) {
    console.log('sdfsdfsdfsd');
    const payload = JSON.stringify({
      data: {
        type: 'ObtainJSONWebToken',
        attributes: {
          username,
          password,
        },
      },
    });
    return new Promise((resolve, reject) => {
      window.axios.post(window.store.state.endpoints.obtainJWT, payload, {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      })
        .then((response) => {
          window.store.dispatch('obtainToken', response.data.data.token);
          return resolve({ error: false, message: 'success' });
        })
        .catch(error => resolve({ error: true, message: error.response.data.errors.non_field_errors[0] }));
    });
  }
}
export default Auth;
