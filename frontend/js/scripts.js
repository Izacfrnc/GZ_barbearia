const API_URL = "http://localhost:3000";

const showAlert = (msg, type = "success") => {
    const container = document.getElementById("alert-container");
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${msg}
            <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
        </div>`;
    setTimeout(() => container.innerHTML = "", 3000);
};

async function fetchJson(url, options = {}) {
    const res = await fetch(`${API_URL}${url}`, options);
    return res.json();
}