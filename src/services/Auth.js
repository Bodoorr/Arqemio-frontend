import Client from './api'

export const SignInUser = async (data) => {
  try {
    const res = await Client.post('/auth/login', data)
    // Set the current signed in users token to localStorage
    if(res.data.token){
    localStorage.setItem('token', res.data.token)
    }
    return res.data
  } catch (error) {
    throw error
  }
}

export const SignOutUser = () => {
  localStorage.removeItem('token')
}

export const CheckToken = async () => {
    return localStorage.getItem('token')}




