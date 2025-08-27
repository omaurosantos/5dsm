import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

# Carregar o banco de dados MNIST
mnist = fetch_openml('mnist_784', version=1)
X, y = mnist.data, mnist.target

# Filtrar apenas os dígitos '3' e outros
y_binary = (y == '3').astype(int)

# Reduzir o tamanho do conjunto de dados
X_sample = X[:10000]  # Usar apenas os primeiros 10.000 exemplos
y_sample = y_binary[:10000]

# Dividir o conjunto de dados entre treinamento e teste
X_train, X_test, y_train, y_test = train_test_split(X_sample, y_sample, test_size=0.2, random_state=42)

# Treinar o modelo de regressão logística
model = LogisticRegression(max_iter=1000, solver='saga')
model.fit(X_train, y_train)

# Avaliar o desempenho no conjunto de teste
y_pred = model.predict(X_test)

# Matriz de confusão
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Not 3", "3"])
disp.plot()
plt.show()