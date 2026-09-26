# 💎 Laghotech - Dashboard Inteligente de Energia & Vídeomonitoramento

Sistema inteligente completo para controle de consumo energético, automação de interruptores e monitoramento por vídeo para residências e pequenos negócios.

---

## 📸 Estrutura Fiel ao Modelo & Layout

O sistema foi desenvolvido seguindo rigorosamente os requisitos e as referências visuais anexadas:

### 1. Layout Central e Numerações (Conforme Rascunho Excalidraw)
* **Posição 1 (Canto Superior Esquerdo) - Luzes (Botões Digitais):**
  * Interruptores táteis interativos com feedback luminoso instantâneo.
  * Exibição de lâmpadas ativas, cômodo e potência em Watts (W).
  * Atalho de alternância rápida de todas as lâmpadas.
  * Cadastro de novas luzes com especificação de cômodo e consumo.

* **Posição 2 (Canto Inferior Esquerdo) - Acesso às Câmeras & Webcam Local:**
  * **CAM 01 - Webcam do Próprio Computador:** Utiliza a webcam integrada/USB real do usuário via WebRTC (`getUserMedia`), com espelhamento natural e HUD de inteligência artificial sobreposto (retículo de rastreamento facial e presença).
  * **Expansão no Centro do Painel:** Ao clicar sobre o feed de vídeo ou no botão **⛶ Expandir**, a câmera se projeta em tamanho ampliado no meio da tela com controles de captura de foto (**📸 Capturar Frame**), alternador de feeds e recolhimento instantâneo (**✕** ou tecla `Esc`).
  * Monitor de vídeo com HUD de vigilância (timestamp ao vivo, retículo de mira, linhas de varredura *scanlines* e indicador de gravação REC piscando).
  * Seletor de câmeras em tempo real (Sua Webcam, Garagem Externa, Jardim/Quintal).
  * Cadastro de novas câmeras de vigilância.

* **Posição 3 (Canto Superior Direito) - Tomadas & Eletrônicos Conectados:**
  * Contador em tempo real do número de tomadas conectadas.
  * Lista de eletrodomésticos e eletrônicos (Geladeira Inverter, TV OLED, Ar Condicionado, Workstation, Cafeteira, etc.).
  * Chaves individuais liga/desliga para cada tomada.
  * Cadastro de novos aparelhos e tomadas.

* **Posição 4 (Canto Inferior Direito) - Relatório Mensal de Consumo:**
  * Indicadores do mês atual vs. mês anterior em kWh e em Reais (R$).
  * Gráfico de barras dos últimos meses (Maio a Setembro).
  * Modal expandido completo com auditoria energética, divisão por setor (Climatização, Eletrodomésticos, Tecnologia, Iluminação) e opção de impressão/salvar em PDF.

* **Posição 5 (Centro) - Gráfico de Velocímetro (Speedometer / Gauge):**
  * Velocímetro digital ultra-fluido desenhado em HTML5 Canvas de alta resolução.
  * Arco dinâmico graduado de 0 a 8 kW/h com escala de cores (Verde -> Amarelo -> Vermelho).
  * Agulha animada e display digital que responde instantaneamente conforme você liga ou desliga qualquer interruptor ou tomada.
  * Micro-oscilação realista da rede elétrica e métricas complementares (Tensão 220V, Custo estimado por dia, Pico diário e Eficiência).

---

## 🎨 Design System & Estética (Notion Dark + Neon Suave)

Inspirado na estética da referência fornecida, o sistema conta com:
- **Modo Dark Profundo** com contraste refinado (`#090c10` / `#0f141c` / `#131923`).
- **Contornos Neon Suaves**: Linhas finas e discretas que valorizam a interface e trazem um visual tecnológico moderno **sem cansar a vista do usuário**.
- **6 Temas Neon Selecionáveis:**
  1. 🟢 **Verde Esmeralda** (*Tema Principal Padrão Laghotech*)
  2. 🔵 **Azul Ciano** (*Tech & Futurista*)
  3. 🔴 **Vermelho Carmim** (*Alerta & Intensidade*)
  4. 🟣 **Roxo Cyberpunk** (*Elegância Noturna*)
  5. 🌸 **Rosa Neon** (*Moderno & Vibrante*)
  6. ⚪ **Branco Minimalista** (*Sóbrio & Alta Clareza*)

---

## 🔐 Autenticação & Telas (Fiel ao Modelo "Lume")

- **Card de Login e Cadastro Flutuante:**
  * Réplica de alta fidelidade da referência da imagem "Lume".
  * Abas segmentadas com cantos arredondados: **ENTRAR** e **CRIAR CONTA**.
  * Campos com contorno neon suave e foco dinâmico.
  * Botão de ação verde brilhante com ícone.
- **Menu do Usuário (Topbar Superior Direita):**
  * Aba curvada verde com nome do usuário (`Daniel Santos`), indicador de status online e dropdown com:
    * Nome e e-mail do usuário.
    * Configurações da Conta.
    * Redefinir Senha.
    * Sair (Logout).

---

## ⚙️ Configurações & Gerenciamento (CRUD)

No painel de Configurações, o usuário pode:
1. **Alterar Temas:** Trocar a paleta neon em tempo real com preview visual.
2. **Perfil & Senha:** Atualizar o nome de exibição e redefinir a senha de acesso.
3. **Gerenciar & Excluir:** Lista completa para remoção/exclusão de luzes, tomadas/eletrônicos e câmeras.

---

## ☕ Como Executar com Java (Backend Integrado)

O sistema possui um servidor nativo desenvolvido em **Java 21 LTS** sem dependências externas:

### Passo a Passo:
1. Abra o terminal na pasta do projeto:
   ```bash
   cd c:\⫘⫘Triforcengine⫘⫘
   ```
2. Compile e inicie o servidor Java:
   ```bash
   javac LaghotechServer.java
   java LaghotechServer
   ```
3. Abra seu navegador em:
   ```
   http://localhost:8080
   ```

*Nota: Você também pode abrir diretamente o arquivo `index.html` em qualquer navegador sem necessidade de servidor.*
# LaghoTech
