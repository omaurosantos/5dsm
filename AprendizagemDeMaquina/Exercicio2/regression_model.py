import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

# Dados da tabela
peso = np.array([1588, 1674, 1560, 1556, 1969, 2005, 1075]).reshape(-1, 1)
eficiencia = np.array([7.65, 6.38, 7.65, 6.80, 6.38, 5.95, 10.20])

# Ajustar o modelo de regressão linear
model = LinearRegression()
model.fit(peso, eficiencia)

# Obter os parâmetros da reta
coef_angular = model.coef_[0]
coef_linear = model.intercept_

print(f"Coeficiente angular: {coef_angular:.4f}")
print(f"Coeficiente linear: {coef_linear:.4f}")

# Predizer a eficiência para um veículo com peso de 1300 kg
peso_pred = np.array([[1300]])
eficiencia_pred = model.predict(peso_pred)
print(f"Eficiência prevista para um veículo de 1300 kg: {eficiencia_pred[0]:.2f} km/l")

# Visualizar os dados e a reta ajustada
plt.scatter(peso, eficiencia, color='blue', label='Dados reais')
plt.plot(peso, model.predict(peso), color='red', label='Reta ajustada')
plt.xlabel('Peso (kg)')
plt.ylabel('Eficiência (km/l)')
plt.legend()
plt.show()