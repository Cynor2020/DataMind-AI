import pandas as pd 
import numpy as np
import matplotlib.pyplot as plt 
import plotly.express as px

def cheack_type(df):
    '''Check Numarical and Categorical columns'''
    numerical_columns = df.select_dtypes(include=['number']).columns
    categorical_columns = df.select_dtypes(exclude=['number']).columns
    print("Numerical Columns:", numerical_columns)
    print("Categorical Columns:", categorical_columns)

def summary_csv(df):
    rows = df.shape[0]
    columns = df.shape[1]
    data_type = df.dtypes
    missing_values = df.isnull().sum()
    print("Rows: ",rows,"\n")
    print("Columns: ",columns,"\n")
    print("Data types","\n",data_type,"\n")
    print("Missing Values:\n",missing_values,"\n")


def statical_fn(df):
    meean  = df.describe()
    print(meean)

def out_lier(df,column,fill_method = "remove", method = 'std_dev'):
    result_dict = {}
    try:
        if not column in df.columns:
            result_dict['status'] = 'error'
            result_dict['message'] = 'Column Does Not Exists!'
            print("Column Does Not Exists!")
            return result_dict
        if not np.issubdtype(df[column].dtype, np.number):
            result_dict['status'] = 'error'
            result_dict['message'] = 'Non-numerical column'
            print("Cannot Oprate on Non-numerical column","\n")
            return result_dict
        if df[column].isna().all():
            result_dict['status'] = 'error'
            result_dict['message'] = 'Column is all NaN'
            print('All Columns Are NaN')
            return result_dict
        if fill_method == "mean":
            df[column] = df[column].fillna(df[column].mean())
            nparr = df[column].to_numpy()
            valid_mask = ~np.isnan(nparr)
            nparr_clean = nparr[valid_mask]
        elif fill_method == "median":
            df[column] = df[column].fillna(df[column].median())
            nparr = df[column].to_numpy()
            valid_mask = ~np.isnan(nparr) 
            nparr_clean = nparr[valid_mask]
        else:
            nparr = df[column].to_numpy()
            valid_mask = ~np.isnan(nparr)
            nparr_clean = nparr[valid_mask]           
        if nparr_clean.size == 0:
            result_dict['status'] = 'error'
            result_dict['message'] = 'No Valid Data'
            return result_dict
        mean = np.mean(nparr_clean)
        std = np.std(nparr_clean)
        if method == 'z_score':
            z_scores = (nparr_clean-mean)/ std
            outlier_condition = np.abs(z_scores) > 2
        else:
            outlier_condition = (nparr_clean < mean - 2 * std) | (nparr_clean > mean + 2 * std)
        outliers = nparr_clean[outlier_condition]
        full_mask = np.zeros(len(df), dtype=bool)
        full_mask[valid_mask] = outlier_condition
        df[f'{column}_Is_Outlier'] = full_mask
        outlier_indices = np.where(full_mask)[0]
        result_dict['outliers'] = outliers
        result_dict['z_scores'] = z_scores if method == 'z_score' else None
        result_dict['stats'] = {
            'mean': mean,
            'std': std,
            'lower_bound': mean - 2 * std,
            'upper_bound': mean + 2 * std
        }
        result_dict['flagged_df'] = df
        result_dict['outlier_indices'] = outlier_indices.tolist()
        result_dict['status'] = 'success'
        return result_dict
    except TypeError:
        result_dict['status'] = 'error'
        result_dict['message'] = 'Non-Numarical data'  
        return result_dict
    except ValueError:
        result_dict['status'] = 'error'
        result_dict['message'] = 'Empty or Invalid data'  
        return result_dict   
    except :
        result_dict['status'] = 'error'
        result_dict['message'] = 'Unexcepted Error'
        return result_dict

def missing_handler(df, column, Fill_Method="none", method="none", value="Unknown", changes="", type="none"):
    """
    Handles missing values in a DataFrame column with fill or remove options.

    Parameters:
    - df (pd.DataFrame): Input DataFrame.
    - column (str): Column to handle.
    - Fill_Method (str): 'none', 'mean', 'median', 'mode', 'custom'.
    - method (str): 'none' or 'remove'.
    - Remove (str): Not used directly; specify 'type' for row/column removal.
    - value: Custom value for 'custom' fill (default: 'Unknown').
    - changes (str): '' (preview), 'fix' (apply), 'revert' (undo).
    - type (str): 'none', 'row', or 'column' for remove.

    Returns:
    - dict: {
        'status': 'success' or 'error',y titd,
        'affected_columns': Number of columns affected,
        'removed_row': Removed row index (if any),
        'removed_column': Removed column name (if any),
        'original_dataframe': Original DataFrame for undo
    }
    """
    result_dict2 = {}
    original_df = df.copy()
    temp_df = df.copy()
    valid_fill_methods = ["none", "mean", "median", "mode", "custom"]
    valid_methods = ["none", "remove"]
    valid_types = ["none", "row", "column"]
    valid_changes = ["", "fix", "revert"]
    affected_rows = 0
    affected_columns = 0
    removed_row = "none"
    removed_column = "none"
    history = []  # For undo history

    try:
        # Validate inputs
        if Fill_Method not in valid_fill_methods:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Invalid Fill_Method'
            return result_dict2

        if method not in valid_methods:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Invalid method'
            return result_dict2

        if type not in valid_types:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Invalid type'
            return result_dict2

        if changes not in valid_changes:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Invalid changes value'
            return result_dict2

        if column not in temp_df.columns:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Column does not exist'
            return result_dict2

        # Initialize history
        if changes == "fix":
            history.append(original_df.copy())

        # Handle revert
        if changes == "revert":
            if history:
                temp_df = history.pop()
            else:
                temp_df = original_df.copy()
            result_dict2['status'] = 'success'
            result_dict2['flagged_df'] = temp_df
            result_dict2['affected_rows'] = 0
            result_dict2['affected_columns'] = 0
            result_dict2['removed_row'] = "none"
            result_dict2['removed_column'] = "none"
            result_dict2['original_dataframe'] = original_df
            return result_dict2

        # Calculate affected rows for fill or remove
        if method == "remove" and type in ["row", "column"]:
            affected_rows = temp_df[column].isna().sum()
        elif Fill_Method != "none":
            affected_rows = temp_df[column].isna().sum()

        # Handle fill operations
        if Fill_Method == "mean":
            if not np.issubdtype(temp_df[column].dtype, np.number):
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Non-numerical column'
                return result_dict2
            if temp_df[column].isna().all():
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Column is all NaN'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].mean())

        elif Fill_Method == "median":
            if not np.issubdtype(temp_df[column].dtype, np.number):
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Non-numerical column'
                return result_dict2
            if temp_df[column].isna().all():
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Column is all NaN'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].median())

        elif Fill_Method == "mode":
            if temp_df[column].mode().empty:
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'No mode available for column'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].mode()[0])

        elif Fill_Method == "custom":
            if np.issubdtype(temp_df[column].dtype, np.number):
                try:
                    value = float(value)
                except ValueError:
                    result_dict2['status'] = 'error'
                    result_dict2['message'] = 'Invalid custom value for numerical column'
                    return result_dict2
            temp_df[column] = temp_df[column].fillna(value)

        # Handle remove operations
        if method == "remove":
            if type == "none":
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Please specify Type of row/column'
                return result_dict2
            elif type == "row":
                temp_df = temp_df.dropna(subset=[column])
                removed_row = f"Rows with NaN in {column}"
            elif type == "column":
                temp_df = temp_df.drop(columns=[column])
                removed_column = column
                affected_columns = 1

        # Prepare result
        result_dict2['status'] = 'success'
        result_dict2['flagged_df'] = temp_df
        result_dict2['affected_rows'] = affected_rows
        result_dict2['affected_columns'] = affected_columns
        result_dict2['removed_row'] = removed_row
        result_dict2['removed_column'] = removed_column
        result_dict2['original_dataframe'] = original_df
        return result_dict2

    except Exception as e:
        result_dict2['status'] = 'error'
        result_dict2['message'] = f'Unexpected error: {str(e)}'
        return result_dict2

def ploot(df,graph_parameters,labels):
    """
    Generate a Plotly graph based on user parameters.
    
    Args:
        df (pd.DataFrame): Input DataFrame.
        graph_parameters (dict): Plot settings with keys:
            - column, row: For faceting (optional).
            - type_graph: Plot type ("scatter", "bar", "histogram").
            - x, y: Columns for x and y axes.
            - title: Plot title.
            - size, symbol, color: Styling columns (optional).
            - opacity: Transparency (default: 0.8).
            - color_scale: Color scale (default: "Viridis").
            - bg_color: Background color (default: "white").
            - grid: Show grid (default: False).
            - grid_color: Grid color (default: "lightgray").
            - legand: Show legend (default: True).
        labels (dict): Custom labels for axes (optional).
    
    Returns:
        str: Plotly chart HTML for frontend rendering.
    
    Raises:
        ValueError: If required columns or graph type are invalid.
    """
    
    column= graph_parameters["column"] # Should Be In Data Frame   
    row = graph_parameters["row"] # Should Be In Data Frame  
    type_graph= graph_parameters["type_graph"] #Will Defined By User 
    x = graph_parameters["x"] if graph_parameters["x"] in df.columns else None # Should Be In Data Frame  
    y = graph_parameters["y"] if graph_parameters["y"] in df.columns else None # Should Be In Data Frame  
    title = graph_parameters["title"] #Will Defined By User 
    size = graph_parameters["size"] if graph_parameters["size"] in df.columns else None # Should Be In Data Frame  
    symbol = graph_parameters["symbol"] if graph_parameters["symbol"] in df.columns else None # Should Be In Data Frame  
    opacity = graph_parameters["opacity"] #Will Defined By User 
    color_scale = graph_parameters["color_scale"] #Will Defined By User 
    color = graph_parameters["color"] if graph_parameters["color"] in df.columns else None  # Should Be In Data Frame  
    bg_color = graph_parameters["bg_color"] #Will Defined By User 
    grid = graph_parameters["grid"] #Will Defined By User 
    grid_color= graph_parameters["grid_color"]#Will Defined By User 
    legand = graph_parameters["legand"] #Will Defined By User 
    if type_graph == "scatter":

        fig = px.scatter(df,x = x,y = y,title = title,color = color
                         ,color_continuous_scale=color_scale,
                         labels=labels, symbol=symbol,opacity=opacity,)
    elif type_graph == "bar":
        fig = px.bar(df, x=x, y=y, title=title, color=color,
                 color_continuous_scale=color_scale, labels=labels,
                 opacity=opacity)
    elif type_graph == "histogram":
        fig = px.histogram(df, x=x, title=title, color=color,
                       color_continuous_scale=color_scale, labels=labels,
                       opacity=opacity)
    else:
     raise ValueError(f"Unsupported graph type: {type_graph}")
        
    if graph_parameters["grid"] == True:
         fig.update_layout(
           showlegend=legand,  # Hide legend
           plot_bgcolor=bg_color,  # White background
           xaxis=dict(showgrid=True, gridcolor= grid_color),
           yaxis=dict(showgrid=True, gridcolor= grid_color))
    return fig.show()



# Numerical Data: Scatter plot, line plot, histogram, box plot.
# def scatter_plt(df):





# #Read The CSV File 
# file_path = "net.csv"
# df = pd.read_csv(file_path)
# cheack_type(df)
# summary_csv(df)
# statical_fn(df)
# result = out_lier(df,"Sales",'mode',"z_score")
# print(result)
# graph_parameters = {

#     "column": "column",
#     "row" : "row",
#     "type_graph": "bar",
#     "x" : "Region",
#     "y" : "Sales",
#     "title" : "Graph",
#     "size": "width",
#     "symbol" : "Sales",
#     "opacity" : 0.5,
#     "color_scale" : "Viridis",
#     "color" : "Sales",
#     "bg_color" : "Black",
#     "grid" : False,
#     "grid_color": "darkred",
#     "legand" : True
    
# }
# labels = {"x" : "sales"}
# result = ploot(df,graph_parameters,labels)
# print(result,df)
# result = missing_handler(df,"Category",Fill_Method="custom",value='pc',method = 'remove',type = 'column')

# print(type(result))
# if result:
#      status =   result['status'] = result.get('status', 'N/A')
#      message = result['message'] = result.get('message', None)
#      outliers = result['outliers'] = result.get('outliers', [])
#      z_scores = result['z_scores'] = result.get('z_scores', [])
#      result['stats'] = result.get('stats', {})
#      result['flagged_df'] = result.get('flagged_df', [])
#      result['flagged_columns'] = result.get('flagged_columns', [])
#      result['outlier_indices'] = result.get('outlier_indices', [])
#      if result['status'] != 'error':
#         if result['outliers'] is not None:
#             result['outliers'] = result['outliers'].tolist()
#         if result['z_scores'] is not None:
#             result['z_scores'] = result['z_scores'].tolist()
#         if result['stats']:
            
#             mean = float(result['stats']['mean']) if result['stats'].get('mean') is not None else None,
#             std = float(result['stats']['std']) if result['stats'].get('std') is not None else None,
#             lower_bound = float(result['stats']['lower_bound']) if result['stats'].get('lower_bound') is not None else None,
#             upper_bound = float(result['stats']['upper_bound']) if result['stats'].get('upper_bound') is not None else None
            
#         else:
#             result['stats'] = {'mean': None, 'std': None, 'lower_bound': None, 'upper_bound': None}

# df['Date'] = pd.to_datetime(df['Date'])
# fig = px.box(x =  df['Date'] , y = z_scores )
# fig.show()