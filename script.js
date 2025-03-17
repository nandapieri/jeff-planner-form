const env = 'test';
const url = env === 'prd' ? 'https://jeff-planner-automation.onrender.com/api/' : 'http://localhost:3000/api/'

// Função para codificar UTF-8 → Base64 (browser compatible)
function utf8ToBase64(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        })
    );
}

// Funções do popup
function openPopup() {
    document.getElementById('termos-de-uso-popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('termos-de-uso-popup').style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('open-termos-btn');
    const closeBtn = document.getElementById('close-termos-btn');

    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openPopup();
    });

    closeBtn.addEventListener('click', closePopup);

    window.addEventListener('click', function(e) {
        if (e.target.id === 'termos-de-uso-popup') {
            closePopup();
        }
    });
});

// Submit do formulário
document.getElementById('formulario-automacao').addEventListener('submit', async function(event) {
    event.preventDefault();
    document.getElementById('loading').style.display = 'flex';

    try {
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Pega termos e codifica corretamente
        const termosContent = document.getElementById('termos-de-uso-popup')
                                .querySelector('.popup-content').textContent;
        data.termos_base64 = utf8ToBase64(termosContent);

        // Debug: Verificar codificação
        console.log('Texto Original:', termosContent);
        console.log('Base64 Gerado:', data.termos_base64);
        console.log('Decodificado:', base64ToUtf8(data.termos_base64));

        // Restante dos dados
        data.hoje = formatDate(new Date());
        data.phoneObj = desmembrarTelefone(data.telefone);
        data.ip_address = await getIPAddress();
        data.timestamp = new Date().toISOString();
        data.user_agent = navigator.userAgent;

        // Envio
        const response = await fetch('https://hook.us2.make.com/cqb1jqu58zj6c1kghgt0wk9c6r2yo2rt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const res = await response.json();
        if (response.ok && res.link) {
            window.location.href = res.link;
        } else {
            throw new Error(res.message || 'Erro no servidor');
        }
        
        this.reset();
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('response').innerText = error.message;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

// Função de decodificação para testes
function base64ToUtf8(str) {
    return decodeURIComponent(
        atob(str).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
    );
}

// Busca de CEP (mantida intacta)
async function fetchAddress() {
    const cep = document.getElementById('cep').value.replace(/[\D-]/g, '');
    if (cep.length !== 8) return alert('CEP inválido!');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) throw new Error('CEP não encontrado');
        
        document.getElementById('rua').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
    } catch (error) {
        alert(error.message);
    }
}

// Funções auxiliares
function formatDate(date) {
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function desmembrarTelefone(tel) {
    return { country: "55", area: tel.substring(0,2), number: tel.substring(2) };
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        return (await response.json()).ip;
    } catch {
        return 'IP não detectado';
    }
}