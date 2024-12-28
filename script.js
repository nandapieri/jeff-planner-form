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

// Lida com o envio do formulário e faz a requisição para a API para gerar o PDF
document.getElementById('formulario-automacao').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    console.log('Sending data:', data);

    try {
        const response = await fetch('https://jeff-planner-automation.onrender.com/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            downloadPDF(result.pdfBase64);
        } else {
            throw new Error('Failed to generate PDF');
        }

        // Chamada para salvar dados no Notion
        const notionResponse = await fetch('https://jeff-planner-automation.onrender.com/api/send-to-notion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('result: ', notionResponse);

        if (notionResponse.ok) {
            console.log('Dados salvos no Notion com sucesso!');
        } else {
            throw new Error('Deu ruim');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response').innerText = error;
    }
});

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
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
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
