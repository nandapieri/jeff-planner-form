const env = 'test';
const url = env === 'prd' ? 'https://jeff-planner-automation.onrender.com/api/' : 'http://localhost:3000/api/'

// Gerencia a visibilidade dos campos do cônjuge com base no tipo de mentoria selecionado
document.querySelectorAll('input[name="tipo"]').forEach((elem) => {
    elem.addEventListener('change', function(event) {
        const camposCasal = document.getElementById('campos-casal');
        const campos = camposCasal.querySelectorAll('input');
        
        if (event.target.value === 'casal') {
            camposCasal.style.display = 'block';
            // Tornar campos do cônjuge obrigatórios
            campos.forEach(campo => campo.required = true);
        } else {
            camposCasal.style.display = 'none';
            // Remover obrigatoriedade dos campos do cônjuge
            campos.forEach(campo => campo.required = false);
        }
    });
});

//versão com webhook do make
// Lida com o envio do formulário e faz a requisição para o webhook do Make
document.getElementById('formulario-automacao').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Mostrar o loading
    document.getElementById('loading').style.display = 'flex';

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    const hoje = formatDate(new Date());
    data.hoje = hoje;
    const phoneObj = desmembrarTelefone(data.telefone);
    data.phoneObj = phoneObj;
    console.log('Enviando dados:', data);

    try {
        // Envia os dados para o webhook do Make
        const response = await fetch('https://hook.us2.make.com/cqb1jqu58zj6c1kghgt0wk9c6r2yo2rt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const res = await response.json();

        if (response.ok) {
            console.log('Dados enviados com sucesso para o webhook!');

            console.log('response: ', res);
            console.log('response body: ', res.body);

            // Verificar se o texto contém a URL para redirecionar
            if (res) {
                try {
                    if (res.link) {
                        // Redirecionar o usuário para a URL fornecida
                        window.location.href = res.link;
                    } else {
                        console.warn('URL de redirecionamento não encontrada na resposta JSON!');
                        document.getElementById('response').innerText = 'URL de redirecionamento não encontrada na resposta. Por favor, tente novamente.';
                    }
                } catch (e) {
                    // Se não for JSON, assumir que é a URL diretamente
                    console.log('Resposta não é JSON, assumindo que é a URL:');
                }
            } else {
                // Caso o texto esteja vazio, exibir uma mensagem de erro
                console.warn('Resposta do servidor vazia!');
                document.getElementById('response').innerText = 'Resposta do servidor vazia. Por favor, tente novamente.';
            }
        } else {
            throw new Error('Falha ao enviar dados para o webhook');
        }

        this.reset();
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('response').innerText = error.message;
    } finally {
        // Esconder o loading
        document.getElementById('loading').style.display = 'none';
    }
});

/* versão com api
// Lida com o envio do formulário e faz a requisição para a API para gerar o PDF
document.getElementById('formulario-automacao').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Mostrar o loading
    document.getElementById('loading').style.display = 'flex';

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    console.log('Sending data:', data);

    try {
        const response = await fetch(`${url}/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            // Abrindo o PDF na mesma aba
            window.location.href = result.url;
        } else {
            throw new Error('Failed to generate PDF');
        }

        const notionResponse = await fetch(`${url}/send-to-notion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (notionResponse.ok) {
            console.log('Dados salvos no Notion com sucesso!');
        } else {
            throw new Error('Deu ruim');
        }
        this.reset();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response').innerText = error.message;
    } finally {
        // Esconder o loading
        document.getElementById('loading').style.display = 'none';
    }
});
**/

// funçao auxiliar para baixar o doc pdf enquanto não temos integraçao com zapsign
function downloadPDF(pdfBase64) {
    try {
        if (!pdfBase64) {
            throw new Error('Base64 string is empty or not provided.');
        }
        const linkSource = `data:application/pdf;base64,${pdfBase64}`;
        const downloadLink = document.createElement('a');
        const fileName = 'contract.pdf';

        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Ocorreu um erro ao tentar baixar o PDF. Por favor, tente novamente.');
    }
}

//Busca de endereço a partir do cep
async function fetchAddress() {
    const cep = document.getElementById('cep').value.replace(/[\D-]/g, '');
    if (cep.length !== 8) {
        alert('Por favor, insira um CEP válido.');
        return;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('Erro ao buscar o endereço.');

        const data = await response.json();
        if (data.erro) {
            alert('CEP não encontrado.');
            return;
        }

        document.getElementById('rua').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
    } catch (error) {
        console.error('Erro ao buscar o endereço:', error);
        alert('Ocorreu um erro ao buscar o endereço. Tente novamente.');
    }
}

// Função auxiliar para formatar a data
function formatDate(date,) {
    const month = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const dia = date.getDate();
    const mes = month[date.getMonth()];
    const ano = date.getFullYear();

    return `${dia} de ${mes} de ${ano}`;
}

function desmembrarTelefone(telefoneCompleto) {
    const ddd = telefoneCompleto.substring(0, 2); // Pegar os dois primeiros dígitos como DDD
    const numero = telefoneCompleto.substring(2); // O restante é o número do telefone
  
    return {
      country: "55",  // Código do país para o Brasil
      area: ddd,
      number: numero
    };
  }