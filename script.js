const env = 'test';
const url = env === 'prd' ? 'https://jeff-planner-automation.onrender.com/api/' : 'http://localhost:3000/api/'

// =================== CONFIGURAÇÃO DOS TERMOS =================== //
// (ATUALIZE ESTES VALORES SEMPRE QUE MUDAR OS TERMOS)
const TERMOS_VERSAO = "1.0";
const TERMOS_HASH = "08bbf7a5612355b6e1676dca406235e09681931cd7468dcacf1cef290f3d0cfb"; // Gere em: https://emn178.github.io/online-tools/sha256.html
const TERMOS_URL = "https://github.com/nandapieri/jeff-planner-form/blob/main/index.html"; // Link direto para os termos

//Para validar os termos, usar o gerador de hash para o texto e verificar se é o mesmo hash salvo no banco de dados.
//Caso seja igual, temos certeza que é o mesmo texto, caso contrário, o texto está errado.

// =================== FUNÇÕES DO POPUP =================== //
function openPopup() {
    document.getElementById('termos-de-uso-popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('termos-de-uso-popup').style.display = 'none';
}

// =================== INICIALIZAÇÃO =================== //
document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('open-termos-btn');
    const closeBtn = document.getElementById('close-termos-btn');

    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openPopup();
    });

    closeBtn.addEventListener('click', closePopup);

    window.addEventListener('click', function(e) {
        if(e.target.id === 'termos-de-uso-popup') closePopup();
    });
});

// =================== SUBMIT HANDLER =================== //
document.getElementById('formulario-automacao').addEventListener('submit', async function(event) {
    event.preventDefault();
    document.getElementById('loading').style.display = 'flex';

    try {
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Dados de aceite dos termos
        data.termos_versao = TERMOS_VERSAO;
        data.termos_hash = TERMOS_HASH;
        data.termos_url = TERMOS_URL;

        // Dados adicionais
        data.ip_address = await getIPAddress();
        data.timestamp = new Date().toISOString();
        data.user_agent = navigator.userAgent;

        console.log('Dados enviados:', data); // Para debug

        // Envio para o Make.com
        const response = await fetch('https://hook.us2.make.com/cqb1jqu58zj6c1kghgt0wk9c6r2yo2rt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const res = await response.json();
        if(response.ok && res.link) {
            window.location.href = res.link;
        } else {
            throw new Error(res.message || 'Erro no processamento');
        }
        
        this.reset();
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('response').innerText = error.message;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

// =================== FUNÇÕES AUXILIARES =================== //
async function fetchAddress() {
    const cep = document.getElementById('cep').value.replace(/[\D-]/g, '');
    if(cep.length !== 8) return alert('CEP inválido!');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if(data.erro) throw new Error('CEP não encontrado');
        
        // Preenche os campos
        document.getElementById('rua').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
    } catch(error) {
        alert(error.message);
    }
}

function formatDate(date) {
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function desmembrarTelefone(tel) {
    return { 
        country: "55",
        area: tel.substring(0,2),
        number: tel.substring(2)
    };
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        return (await response.json()).ip;
    } catch {
        return 'IP não detectado';
    }
}