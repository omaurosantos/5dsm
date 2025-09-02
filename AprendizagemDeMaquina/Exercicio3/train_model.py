import pandas as pd
from sklearn.tree import DecisionTreeClassifier, plot_tree
import matplotlib.pyplot as plt

# 1. Carregamento dos dados a partir do arquivo Excel
try:
    df = pd.read_excel('data/Play.xlsx')
except FileNotFoundError:
    print("Erro: O arquivo 'data/Play.xlsx' não foi encontrado.")
    print("Por favor, certifique-se de que o arquivo existe e que o script está sendo executado a partir da pasta 'projeto_arvore_decisao'.")
    exit()

# Remove a coluna 'DIA', pois ela é apenas um identificador e não uma feature
if 'DIA' in df.columns:
    df = df.drop(columns=['DIA'])

print("DataFrame Carregado do Arquivo (primeiras 5 linhas):\n", df.head())
print("\n-----------------------------------\n")

# 2. Pré-processamento dos Dados - Transformando variáveis categóricas em numéricas
df_processado = df.copy() # Cria uma cópia para manter o dataframe original intacto
for coluna in df_processado.columns:
    if df_processado[coluna].dtype == 'object':
        df_processado[coluna] = df_processado[coluna].astype('category').cat.codes

print("DataFrame Transformado (primeiras 5 linhas):\n", df_processado.head())
print("\n-----------------------------------\n")

# 3. Definição das variáveis de entrada (features) e de saída (target)
features = ['TEMPO', 'TEMPERATURA', 'UMIDADE', 'VENTO']
target = 'JOGA'

X = df_processado[features]
y = df_processado[target]

# 4. Criação e treinamento do modelo de Árvore de Decisão
modelo_arvore = DecisionTreeClassifier(criterion='entropy', random_state=42)
modelo_arvore.fit(X, y)

print("Modelo de árvore de decisão treinado com sucesso!")

# 5. Visualização da Árvore de Decisão
#    Usa os nomes das categorias originais para uma melhor interpretação
nome_classes = df['JOGA'].astype('category').cat.categories
plt.figure(figsize=(15, 12))
plot_tree(modelo_arvore, 
          feature_names=features, 
          class_names=list(nome_classes),
          filled=True, 
          rounded=True, 
          fontsize=10)
plt.title('Árvore de Decisão para o conjunto de dados "Play"')
plt.savefig('arvore_decisao_play.png')

print("A visualização da árvore foi salva como 'arvore_decisao_play.png'.")