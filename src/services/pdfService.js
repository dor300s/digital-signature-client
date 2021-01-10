import Axios from 'axios';
const axios = Axios.create({ withCredentials: true });
const baseUrl = process.env.NODE_ENV === 'production' ? '/api/pdf' : 'http://localhost:3030/api/pdf';

export function getPdf(id) {
    return axios.get(`${baseUrl}/${id}`).then(res => res.data);
}

export function savePdf(pdf) {
    return !pdf._id ?
        axios.post(baseUrl, pdf).then(res => res.data) :
        axios.put(baseUrl, pdf).then(res => res.data);
}
