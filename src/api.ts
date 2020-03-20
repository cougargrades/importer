import fetch from 'node-fetch'
import * as qs from 'query-string'

export class API {
    baseUrl: string;
    accessToken: string;
    constructor(accessToken: string = '<none>', testing: boolean = false) {
        this.baseUrl = testing 
                        ? 'https://us-central1-cougargrades-testing.cloudfunctions.net/api' 
                        : 'https://us-central1-cougargrades-aefb6.cloudfunctions.net/api';
        this.accessToken = accessToken;
    }

    async self(): Promise<any> {
        let res = await fetch(`${this.baseUrl}/private/tokens/self`, {
            method: 'get',
            headers: {
                'X-Access-Token': this.accessToken
            }
        })
        return (res.status === 200) ? await res.json() : null;
    }
    
    async get(endpoint: string = '/', querystring: object = {}): Promise<any> {
        let res = await fetch(`${this.baseUrl}${endpoint}?${qs.stringify(querystring)}`, {
            method: 'get',
            headers: {
                'X-Access-Token': this.accessToken
            }
        })
        return await res.json()
    }

    async post(endpoint: string = '/', body: object = {}): Promise<any> {
        let res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'post',
            headers: {
                'X-Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        return await res.json()
    }

    async put(endpoint: string = '/', body: object = {}): Promise<any> {
        let res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'put',
            headers: {
                'X-Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        return await res.json()
    }

    async delete(endpoint: string = '/', body: object = {}): Promise<any> {
        let res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'delete',
            headers: {
                'X-Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        return await res.json()
    }
}