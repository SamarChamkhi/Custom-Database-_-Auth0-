async function login(email, password, callback) {
    const axios = require('axios');
  
    async function requestTokensEU(email, password, tenantUrl, clientId, clientSecret) {
      console.log("-----requestTokens EU Tenant--------------");
      try {
        const response = await axios.post(`https://${tenantUrl}/oauth/token`, {
          grant_type: 'password',
          username: email,
          password: password,
          audience: `https://${tenantUrl}/api/v2/`,
          scope: 'openid profile email',
          client_id: clientId,
          client_secret: clientSecret
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity'
          },
          timeout: configuration.TIMEOUT ? configuration.TIMEOUT : 1000
        });
        return response.data;
      } catch (err) {
        console.log('User not found in EU tenant');
        console.error('Auth0 Error:', err);
  
      }
    }
    async function requestTokensUS(email, password, tenantUrl, clientId, clientSecret) {
      console.log("-----requestTokens US Tenant--------------");
      try {
        const response = await axios.post(`https://${tenantUrl}/oauth/token`, {
          grant_type: 'password',
          username: email,
          password: password,
          audience: `https://${tenantUrl}/api/v2/`,
          scope: 'openid profile email',
          client_id: clientId,
          client_secret: clientSecret
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity'
          },
          timeout: configuration.TIMEOUT ? configuration.TIMEOUT : 1000
        });
        return response.data;
      } catch (err) {
        console.log('User not found in US tenant');
        console.error('Auth0 Error:', err);
        
      }
    }
    async function getUserInfo(accessToken, tenantUrl) {
      try {
        const response = await axios.get(`https://${tenantUrl}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }
  
    function removeUserIdPrefix(userId) {
      return userId.replace(/(auth0\|)?(.*)/, '$2');
    }
  
    async function userInEuTenant(email, password) {
      const response = await requestTokensEU(email, password, configuration.AUTH0_TENANT_URL_EU,configuration.AUTH0_CLIENT_ID_EU, configuration.AUTH0_CLIENT_SECRET_EU);
      if (!response || !response.access_token) {
        return null;
      }
      const userInfo = await getUserInfo(response.access_token, configuration.AUTH0_TENANT_URL_EU);
      return userInfo ? { ...userInfo, id_token: response.id_token } : null;
    }
  
    async function userInUsTenant(email, password) {
      const response = await requestTokensUS(email, password, configuration.AUTH0_TENANT_URL_US, configuration.AUTH0_CLIENT_ID_US, configuration.AUTH0_CLIENT_SECRET_US);
      if (!response || !response.access_token) {
        return null;
      }
      const userInfo = await getUserInfo(response.access_token, configuration.AUTH0_TENANT_URL_US);
      return userInfo ? { ...userInfo, id_token: response.id_token } : null;
    }
    
    try {
      let userInfo =  await userInEuTenant(email, password);
      console.log('---- User Info In EU Tenant -----:', userInfo);
      return callback(null, {
        user_id: removeUserIdPrefix(userInfo.sub),
        nickname: userInfo.nickname,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      });
    }catch(error) {
      try{
        let userInfo =  await userInUsTenant(email, password);
        console.log('---- User In US Tenant -----:', userInfo);
        return callback(null, {
          user_id: removeUserIdPrefix(userInfo.sub),
          nickname: userInfo.nickname,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        });
      }catch(error){
        return callback(new Error('User not found in any tenant'));
      }
    }
  }
  
  