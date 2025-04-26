import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import io
import base64
import warnings
warnings.filterwarnings('ignore')

def analyze_csv_with_ai(csv_file_path):
    """
    Analyzes a CSV file with AI-driven insights and returns plots as base64 strings.
    Args:
        csv_file_path: Path to the CSV file.
    Returns:
        Dict with insights, predictions, and plot data as base64 strings.
    """
    # Read CSV
    try:
        df = pd.read_csv(csv_file_path)
    except Exception as e:
        return {"error": f"Error reading CSV: {str(e)}"}

    # Initialize results dictionary
    results = {
        "insights": {},
        "predictions": {},
        "plots": []
    }

    # Basic Insights
    results["insights"]["shape"] = {"rows": df.shape[0], "columns": df.shape[1]}
    results["insights"]["columns"] = list(df.columns)
    results["insights"]["missing_values"] = df.isnull().sum().to_dict()
    results["insights"]["data_types"] = df.dtypes.astype(str).to_dict()

    # Numerical and Categorical Columns
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns

    # Statistical Insights for Numerical Columns
    if len(numerical_cols) > 0:
        stats = df[numerical_cols].describe()
        results["insights"]["numerical_stats"] = stats.to_dict()
        results["insights"]["skewness"] = df[numerical_cols].skew().to_dict()
        results["insights"]["kurtosis"] = df[numerical_cols].kurtosis().to_dict()

    # Categorical Insights
    if len(categorical_cols) > 0:
        results["insights"]["categorical_unique"] = {
            col: df[col].nunique() for col in categorical_cols
        }
        results["insights"]["categorical_top_values"] = {
            col: df[col].value_counts().head(5).to_dict() for col in categorical_cols
        }

    # AI-Driven Predictions (Linear Regression for Numerical Data)
    if len(numerical_cols) >= 2:
        target_col = numerical_cols[0]
        feature_cols = numerical_cols[1:]
        df_clean = df[[target_col] + list(feature_cols)].dropna()

        if len(df_clean) > 0:
            X = df_clean[feature_cols]
            y = df_clean[target_col]
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            model = LinearRegression()
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            results["predictions"]["target"] = target_col
            results["predictions"]["features"] = list(feature_cols)
            results["predictions"]["r2_score"] = model.score(X_test, y_test)
            results["predictions"]["coefficients"] = dict(zip(feature_cols, model.coef_))
            results["predictions"]["sample_predictions"] = list(zip(y_test[:5].values, y_pred[:5]))

    # Encode Categorical Columns for Correlation Analysis
    df_encoded = df.copy()
    le = LabelEncoder()
    for col in categorical_cols:
        df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
    
    # Correlation Analysis
    if len(numerical_cols) > 0 or len(categorical_cols) > 0:
        corr_matrix = df_encoded.corr()
        results["insights"]["correlation"] = corr_matrix.to_dict()

    # Plotting (Return as base64 strings)
    plot_data = []

    # 1. Histogram for Numerical Columns
    for col in numerical_cols:
        plt.figure(figsize=(8, 6))
        plt.hist(df[col].dropna(), bins=20, color='skyblue', edgecolor='black')
        plt.title(f'Histogram of {col}')
        plt.xlabel(col)
        plt.ylabel('Frequency')
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data.append({
            "name": f"histogram_{col}.png",
            "data": base64.b64encode(buf.getvalue()).decode('utf-8')
        })
        plt.close()

    # 2. Box Plot for Numerical Columns
    if len(numerical_cols) > 0:
        plt.figure(figsize=(10, 6))
        df[numerical_cols].boxplot()
        plt.title('Box Plot of Numerical Columns')
        plt.xticks(rotation=45)
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data.append({
            "name": "box_plot.png",
            "data": base64.b64encode(buf.getvalue()).decode('utf-8')
        })
        plt.close()

    # 3. Bar Plot for Categorical Columns (Top 5 Values)
    for col in categorical_cols:
        plt.figure(figsize=(8, 6))
        value_counts = df[col].value_counts().head(5)
        plt.bar(value_counts.index, value_counts.values, color='lightgreen', edgecolor='black')
        plt.title(f'Top 5 Values in {col}')
        plt.xlabel(col)
        plt.ylabel('Count')
        plt.xticks(rotation=45)
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data.append({
            "name": f"bar_{col}.png",
            "data": base64.b64encode(buf.getvalue()).decode('utf-8')
        })
        plt.close()

    # 4. Correlation Heatmap
    if len(numerical_cols) > 0 or len(categorical_cols) > 0:
        plt.figure(figsize=(10, 8))
        plt.imshow(corr_matrix, cmap='coolwarm', interpolation='nearest')
        plt.colorbar()
        plt.xticks(np.arange(len(corr_matrix.columns)), corr_matrix.columns, rotation=45)
        plt.yticks(np.arange(len(corr_matrix.columns)), corr_matrix.columns)
        plt.title('Correlation Heatmap')
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data.append({
            "name": "correlation_heatmap.png",
            "data": base64.b64encode(buf.getvalue()).decode('utf-8')
        })
        plt.close()

    # 5. Prediction Plot (if predictions were made)
    if "sample_predictions" in results["predictions"]:
        plt.figure(figsize=(8, 6))
        actual = [x[0] for x in results["predictions"]["sample_predictions"]]
        predicted = [x[1] for x in results["predictions"]["sample_predictions"]]
        plt.scatter(range(len(actual)), actual, color='blue', label='Actual')
        plt.scatter(range(len(predicted)), predicted, color='red', label='Predicted')
        plt.title(f'Actual vs Predicted for {target_col}')
        plt.xlabel('Sample Index')
        plt.ylabel(target_col)
        plt.legend()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data.append({
            "name": "prediction_plot.png",
            "data": base64.b64encode(buf.getvalue()).decode('utf-8')
        })
        plt.close()

    results["plots"] = plot_data
    return results