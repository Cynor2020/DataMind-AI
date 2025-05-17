import pandas as pd 
import numpy as np
import matplotlib.pyplot as plt 
import plotly.express as px
import reportlab as rl
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
import uuid
import os
# from pymongo import MongoClient
# from pymongo.errors import ConnectionError, PyMongoError

def summary_csv(df):
    result_dict0 = {}
    try:
        rows = df.shape[0]
        column = df.shape[1]
        data_type = df.dtypes
        numerical_columns = df.select_dtypes(include=['number']).columns
        categorical_columns = df.select_dtypes(exclude=['number']).columns
        missing_values = df.isnull().sum()
        statifn  = df.describe()
        result_dict0['status'] = 'success'
        result_dict0['message'] = 'Here is the summary of Data '
        result_dict0['Rows'] = rows
        result_dict0['Columns'] = column
        result_dict0['Datatype'] = data_type
        result_dict0['Numarical_columns'] = numerical_columns
        result_dict0['Categorical_columns'] = categorical_columns
        result_dict0['Missing_Values'] = missing_values
        result_dict0['Stats'] = statifn
        return result_dict0
    except Exception as e:
        result_dict0['status'] = 'error'
        result_dict0['message'] = 'An error occured'
        result_dict0['error'] = str(e)

def out_lier(df,column,fill_method = 'remove', method = 'std_dev'):
    result_dict = {}
    try:
        pd.set_option('display.max_columns', None)
        if not column in df.columns:
            result_dict['status'] = 'error'
            result_dict['message'] = 'Column Does Not Exists!'
            print('Column Does Not Exists!')
            return result_dict
        if not np.issubdtype(df[column].dtype, np.number):
            result_dict['status'] = 'error'
            result_dict['message'] = 'Non-numerical column'
            print('Cannot Oprate on Non-numerical column','\n')
            return result_dict
        if df[column].isna().all():
            result_dict['status'] = 'error'
            result_dict['message'] = 'Column is all NaN'
            print('All Columns Are NaN')
            return result_dict
        if fill_method == 'mean':
            df[column] = df[column].fillna(df[column].mean())
            nparr = df[column].to_numpy()
            valid_mask = ~np.isnan(nparr)
            nparr_clean = nparr[valid_mask]
        elif fill_method == 'median':
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
            df['Z_scores'] = z_scores
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

def missing_handler(df, column, Fill_Method='none', method='none', value='Unknown', type='none'):
    '''
    Handles missing values in a DataFrame column with fill or remove options.

    Parameters:
    - df (pd.DataFrame): Input DataFrame.
    - column (str): Column to handle / all.
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
    '''
    result_dict2 = {}
    original_df = df.copy()
    temp_df = df.copy()
    valid_fill_methods = ['none', 'mean', 'median', 'mode', 'custom']
    valid_methods = ['none', 'remove']
    valid_types = ['none', 'row', 'column']
    affected_rows = 0
    affected_columns = 0
    removed_row = 'none'
    removed_column = 'none'
  # For undo history

    try:
        pd.set_option('display.max_columns', None)
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



        if column not in temp_df.columns:
            result_dict2['status'] = 'error'
            result_dict2['message'] = 'Column does not exist'
            return result_dict2

        # Initialize history


        # Handle revert
 

        # Calculate affected rows for fill or remove
        if method == 'remove' and type in ['row', 'column']:
            affected_rows = temp_df[column].isna().sum()
        elif Fill_Method != 'none':
            affected_rows = temp_df[column].isna().sum()

        # Handle fill operations
        if Fill_Method == 'mean':
            if not np.issubdtype(temp_df[column].dtype, np.number):
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Non-numerical column'
                return result_dict2
            if temp_df[column].isna().all():
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Column is all NaN'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].mean())

        elif Fill_Method == 'median':
            if not np.issubdtype(temp_df[column].dtype, np.number):
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Non-numerical column'
                return result_dict2
            if temp_df[column].isna().all():
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Column is all NaN'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].median())

        elif Fill_Method == 'mode':
            if temp_df[column].mode().empty:
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'No mode available for column'
                return result_dict2
            temp_df[column] = temp_df[column].fillna(temp_df[column].mode()[0])

        elif Fill_Method == 'custom':
            if np.issubdtype(temp_df[column].dtype, np.number):
                try:
                    value = float(value)
                except ValueError:
                    result_dict2['status'] = 'error'
                    result_dict2['message'] = 'Invalid custom value for numerical column'
                    return result_dict2
            temp_df[column] = temp_df[column].fillna(value)

        # Handle remove operations
        if method == 'remove':
            if type == 'none':
                result_dict2['status'] = 'error'
                result_dict2['message'] = 'Please specify Type of row/column'
                return result_dict2
            elif type == 'row':
                temp_df = temp_df.dropna(subset=[column])
                removed_row = f'Rows with NaN in {column}'
            elif type == 'column':
                temp_df = temp_df.drop(columns=[column])
                removed_column = column
                affected_columns = 1

        # Prepare result
        result_dict2['status'] = 'success'
        result_dict2['affected_rows'] = affected_rows
        result_dict2['affected_columns'] = affected_columns
        result_dict2['removed_row'] = removed_row
        result_dict2['removed_column'] = removed_column
        result_dict2['flagged_df'] = temp_df
        # result_dict2['original_dataframe'] = original_df
        return result_dict2

    except Exception as e:
        result_dict2['status'] = 'error'
        result_dict2['message'] = f'Unexpected error: {str(e)}'
        return result_dict2

def remove_duplicates(df,column,typee):
    result_dict3 = {}
    temp_df  = df.copy()
    before = temp_df.shape[0]
    try:
      pd.set_option('display.max_columns', None)
      if typee == 'all':
          result = temp_df.drop_duplicates(keep='first' )
          after = result.shape[0]
          total = before - after 
          result_dict3['status'] = ['success']
          result_dict3['message'] = [f'removed {total} ']
          result_dict3['result'] = result
          return result_dict3 
      if not column in df :
          result_dict3['status'] = 'error'
          result_dict3['message'] = 'column doesnot exists'
          return result_dict3
      if typee == 'column':
          result = temp_df.drop_duplicates(subset=[column], keep='first' )
          after = result.shape[0]
          total = before - after 
          result_dict3['status'] = ['success']
          result_dict3['message'] = [f'removed {total} ']
          result_dict3['flagged_df'] = result
          return result_dict3 
    except Exception as e :
        result_dict3['status'] = 'error'
        result_dict3['message'] = 'An error occured'
        result_dict3['error'] = e
        return result_dict3
    

def fix_datatypes(df,column,target_type):
    valid_types = ['datetime','int','float']
    temp_df = df.copy()
    result_dict4  = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in temp_df:
            result_dict4['status'] = 'error'
            result_dict4['message'] = f'Column {column} not found'
            return result_dict4
        if target_type not in valid_types:
            result_dict4['status'] = 'error'
            result_dict4['message'] = 'Invalid Type'
            return result_dict4
        if target_type == 'datetime':
            result = pd.to_datetime(temp_df[column],errors='coerce')
            temp_df[column] = result
            result_dict4['status'] = 'success'
            result_dict4['message'] = 'Data type changed'
            result_dict4['flagged_df'] = temp_df
            return result_dict4
        elif target_type == 'int' or target_type == 'float':
            result = pd.to_numeric(temp_df[column],errors='coerce')
            temp_df[column] = result
            result_dict4['status'] = 'success'
            result_dict4['message'] = 'Data type changed'
            result_dict4['flagged_df'] = temp_df
            return result_dict4
    except Exception as e :
        result_dict4['status'] = 'error'
        result_dict4['message'] = 'An error occured'
        result_dict4['error'] = e
        return result_dict4     


def correct_data(df,column,standardize_to,custom = None):
    valid = ['upper','lower','custom']
    temp_df = df.copy()
    result_dict5 = {}
    mapp = custom 
    try:
      pd.set_option('display.max_columns', None)
      if column not in temp_df:
            result_dict5['status'] = 'error'
            result_dict5['message'] = f'Column {column} not found'
            return result_dict5
      if standardize_to not in valid:
            result_dict5['status'] = 'error'
            result_dict5['message'] = 'Invalid Type'
            return result_dict5
      if standardize_to == 'upper':
          temp_df[column] = temp_df[column].str.upper()
          result_dict5['status'] = 'success'
          result_dict5['message'] = f'{column} standardlized to uppercase'
          result_dict5['flagged_df'] = temp_df
          return result_dict5
      if standardize_to == 'lower':
          temp_df[column] = temp_df[column].str.lower()
          result_dict5['status'] = 'success'
          result_dict5['message'] = f'{column} standardlized to lowercase'
          result_dict5['flagged_df'] = temp_df
          return result_dict5
      if standardize_to == 'custom' :
          if not isinstance(mapp, dict):
            result_dict5['status'] = 'error'
            result_dict5['message'] = 'Custom_mapping must be a dictionary'
            return result_dict5
          
          mapp = {str(k): v for k, v in mapp.items()}
          temp_df[column] = temp_df[column].replace(mapp)
          result_dict5['status'] = 'success'
          result_dict5['message'] = f'standardlized {mapp}  '
          result_dict5['flagged_df'] = temp_df
          return result_dict5
      
    except Exception as e:
        result_dict5['status'] = 'error'
        result_dict5['message'] = 'An error occured'
        result_dict5['error'] = e
        return result_dict5     
    
def standardize_data(df,column,rule):
    valid = ['to_kg', 'to_meter']
    temp_df = df.copy()
    result_dict6 = {}
    try:
      pd.set_option('display.max_columns', None)
      if column not in temp_df :
          result_dict6['status'] = 'error'
          result_dict6['message'] = f'column {column}  not found'
          return result_dict6
      if rule not in valid :
          result_dict6['status'] = 'error'
          result_dict6['message'] = 'Invalid conversion or conversion not avaliable'
          return result_dict6
      if rule == 'to_kg':
          temp_df[column] = temp_df[column] * 0.453592
          result_dict6['status'] = 'success'
          result_dict6['message'] = f'values of column {column} converted to kg from pound '
          result_dict6['flagged_df'] = temp_df
          return result_dict6
      if rule == 'to_meter':
          temp_df[column] = temp_df[column] * 0.3048
          result_dict6['status'] = 'success'
          result_dict6['message'] = f'values of column {column} converted to meters from feet'
          result_dict6['flagged_df'] = temp_df
          return result_dict6
    except Exception as e:
        result_dict6['status'] = 'error'
        result_dict6['message'] = 'An error occured'
        result_dict6['error'] = e
        return result_dict6     
           
def remove_data(df,list_columns,list_row ):
    temp_df = df.copy()
    result_dict7 = {}
    try:

      if list_columns :    
        for collumns in list_columns:
          temp_df = temp_df.drop(columns = [collumns])  
        result_dict7['status'] = 'success'
        result_dict7['removed_columns'] = f' {list_columns}'
        result_dict7['flagged_df'] = temp_df
      if list_row :
          for rows in list_row:
              temp_df = temp_df.drop(rows)
          result_dict7['status'] = 'success'
          result_dict7['removed_rowes'] = f' {list_row}'
          result_dict7['flagged_df'] = temp_df
      return result_dict7
    except Exception as e:
        result_dict7['status'] = 'error'
        result_dict7['message'] = 'An error occured'
        result_dict7['error'] = e
        return result_dict7 
    
def qut(temp_df,column):
 numeric_cols = column
 for col in numeric_cols:

    temp_df[f'q25 {col}'] = temp_df[col].quantile(0.25)  # 25% quartile
    temp_df[f'q50 {col}'] = temp_df[col].quantile(0.50)  # 50% quartile (median)
    temp_df[f'q75 {col}'] = temp_df[col].quantile(0.75)  # 75% quartile
    return temp_df
 
def descriptive_statistics(df,column,method):
    temp_df = df.copy()
    result_dict8 = {} 
    val_counts_dict = {}
    
    pd.set_option('display.max_columns', None)
    valid = ['mean','median','mode','std_dev','all','min','max']
    try:
        
        if method not in valid:
            result_dict8['status'] = 'error'
            result_dict8['message'] = 'Invalid Method'
            return result_dict8
        
        if method == 'mean':
            for columns in column:
                temp_df[f'mean_{columns}'] = temp_df[columns].mean()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'mean calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8
        if method == 'median':
            for columns in column:
                temp_df[f'median_{columns}'] = temp_df[columns].median()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'median calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8
        if method == 'mode':
            for columns in column:
                temp_df[f'mode_{columns}'] = temp_df[columns].mode()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'moded calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8
        if method == 'min':
            for columns in column:
                temp_df[f'min_{columns}'] = temp_df[columns].min()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'min calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8
        if method == 'max':
            for columns in column :
                temp_df[f'max {columns}'] = temp_df[columns].max()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'max calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8
        if method == 'std_dev':
            for col in column:
                temp_df[f'std_dev {col}'] = temp_df[col].std()
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'max calculated'
            result_dict8['flagged_df'] = temp_df
            return result_dict8            
        if method == 'all':
            for columns in column:
                temp_df[f'min_{columns}'] = temp_df[columns].min()
                temp_df[f'max_{columns}'] = temp_df[columns].max()
                temp_df[f'mean_{columns}'] = temp_df[columns].mean()
                temp_df[f'median_{columns}'] = temp_df[columns].median()
                temp_df[f'mode_{columns}'] = temp_df[columns].mode()
            for col in temp_df.select_dtypes(include=['object', 'category']).columns:
                val_counts_dict[f'count {col}'] = temp_df[col].value_counts()
            for col in column:
                temp_df[f'std_dev {col}'] = temp_df[col].std()
            res =  qut(temp_df=temp_df,column=column)
            result_dict8['status'] = 'success'
            result_dict8['message'] = 'mean median mode min max calculated'
            # print(temp_df.to_string())
            result_dict8['flagged_df'] = res
            result_dict8['value_counts'] = val_counts_dict
            return result_dict8
        
    except Exception as e:
        result_dict8['status'] = 'error'
        result_dict8['message'] = 'an error occured'
        result_dict8['error'] = e
        return result_dict8
        
def data_transformation(df, new_col, formula):
    result_dict9 = {}
    operators = ['*', '/', '+', '-']
    try:
        pd.set_option('display.max_columns', None)
        operation = None
        for op in operators:
            if op in formula:
                formula_parts = formula.split(op)
                operation = op
                break
    
        if operation is None:
            result_dict9['status'] = 'error'
            result_dict9['message'] = 'No valid operator found in formula'
            return result_dict9
    
        col1, col2 = [part.strip() for part in formula_parts]
        if col1 not in df.columns or col2 not in df.columns:
            result_dict9['status'] = 'error'
            result_dict9['message'] = 'One or more columns not found'
            return result_dict9
        if operation == '*':
            df[new_col] = df[col1] * df[col2]
        elif operation == '/':
            df[new_col] = df[col1] / df[col2]
        elif operation == '+':
            df[new_col] = df[col1] + df[col2]
        elif operation == '-':
            df[new_col] = df[col1] - df[col2]
        result_dict9['status'] = 'success'
        result_dict9['message'] = f'{new_col}Trasformed '
        result_dict9['flagged_df'] = df
        return result_dict9
    except Exception as e:
        result_dict9['status'] = 'error'
        result_dict9['message'] = 'an error occured'
        result_dict9['error'] = e
        return result_dict9
def normalize_data(df , column):
    result_dit10 = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in df :
            result_dit10['status'] = 'error'
            result_dit10['message'] = 'column not found'
            return result_dit10
        if not np.issubdtype(df[column].dtype, np.number):
            result_dit10['status'] = 'error'
            result_dit10['message'] = 'column should be numarical'
            return result_dit10
        min = df[column].min()
        max = df[column].max()
        if min != max :
            df[column] = (df[column] - min) / (max-min)
            result_dit10['status'] = 'success'
            result_dit10['message'] = f'{column} normalized'
            result_dit10['flagged_df'] = df
            return result_dit10
        else :
            df[column] = (df[column]*0 )
            result_dit10['status'] = 'success'
            result_dit10['message'] = f'{column} set to 0'
            result_dit10['flagged_df'] = df
            return result_dit10
    except Exception as e:
        result_dit10['status'] = 'error'
        result_dit10['message'] = 'an error occured'
        result_dit10['error'] = e
        return result_dit10

def encode_categorical(df, column, method):
    result_dict11 = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in df.columns:
            result_dict11['status'] = 'error'
            result_dict11['message'] = f'Column {column} not found'
            return result_dict11
        if method == 'one_hot':
            encoded_df = pd.get_dummies(df[column], prefix=column)
            result_dict11['status'] = 'success'
            result_dict11['message'] = f'One-hot encoding applied to {column}'
            result_dict11['flagged_df'] = encoded_df
            return result_dict11
        elif method == 'label':
            df[column] = df[column].astype('category').cat.codes
            result_dict11['status'] = 'success'
            result_dict11['message'] = f'Label encoding applied to {column}'
            result_dict11['flagged_df'] = df
            return result_dict11
        else:
            result_dict11['status'] = 'error'
            result_dict11['message'] = 'Invalid encoding method'
            return result_dict11
    except Exception as e:
        result_dict11['status'] = 'error'
        result_dict11['message'] = 'An error occurred'
        result_dict11['error'] = str(e)
        return result_dict11


def aggregate_data(df, group_by, value_column, agg_method):
    result_dict12 = {}
    try:
        pd.set_option('display.max_columns', None)
        if group_by not in df.columns or value_column not in df.columns:
            result_dict12['status'] = 'error'
            result_dict12['message'] = 'Group by or value column not found'
            return result_dict12
        if agg_method == 'sum':
            result = df.groupby(group_by)[value_column].sum().reset_index()
        elif agg_method == 'mean':
            result = df.groupby(group_by)[value_column].mean().reset_index()
        elif agg_method == 'count':
            result = df.groupby(group_by)[value_column].count().reset_index()
        else:
            result_dict12['status'] = 'error'
            result_dict12['message'] = 'Invalid aggregation method'
            return result_dict12
        result_dict12['status'] = 'success'
        result_dict12['message'] = f'Aggregation successful using {agg_method}'
        result_dict12['flagged_df'] = result
        return result_dict12
    except Exception as e:
        result_dict12['status'] = 'error'
        result_dict12['message'] = 'An error occurred'
        result_dict12['error'] = str(e)
        return result_dict12
     
def bin_data(df, column, bins):
    result_dict13 = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in df.columns:
            result_dict13['status'] = 'error'
            result_dict13['message'] = 'Column not found'
            return result_dict13
        if not isinstance(bins, list) or len(bins) < 2:
            result_dict13['status'] = 'error'
            result_dict13['message'] = 'Invalid bins'
            return result_dict13
        df[column + '_binned'] = pd.cut(df[column], bins=bins)
        result_dict13['status'] = 'success'
        result_dict13['message'] = f'Binning applied to {column}'
        result_dict13['flagged_df'] = df
        return result_dict13
    except Exception as e:
        result_dict13['status'] = 'error'
        result_dict13['message'] = 'An error occurred'
        result_dict13['error'] = str(e)
        return result_dict13

def filter_data(df, column, condition):
    result_dict14 = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in df.columns:
            result_dict14['status'] = 'error'
            result_dict14['message'] = 'Column not found'
            return result_dict14
        filtered_df = df.query(condition)
        result_dict14['status'] = 'success'
        result_dict14['message'] = f'Data filtered using condition: {condition}'
        result_dict14['flagged_df'] = filtered_df
        return result_dict14
    except Exception as e:
        result_dict14['status'] = 'error'
        result_dict14['message'] = 'An error occurred'
        result_dict14['error'] = str(e)
        return result_dict14
    
    
def split_column(df, column, split_into):
    result_dict15 = {}
    try:
        pd.set_option('display.max_columns', None)
        if column not in df.columns:
            result_dict15['status'] = 'error'
            result_dict15['message'] = 'Column not found'
            return result_dict15
        if split_into <= 0:
            result_dict15['status'] = 'error'
            result_dict15['message'] = 'Invalid number of splits'
            return result_dict15

        df[column] = df[column].astype(str)

        split_cols = df[column].str.split(expand=True)
        if split_cols.shape[1] < split_into:
            result_dict15['status'] = 'error'
            result_dict15['message'] = f'Cannot split column into {split_into} parts; only {split_cols.shape[1]} parts available'
            return result_dict15
        for i in range(split_into):
            df[f'{column}_part_{i+1}'] = split_cols[i]
        result_dict15['status'] = 'success'
        result_dict15['message'] = f'Column {column} split into {split_into} parts'
        result_dict15['flagged_df'] = df
        return result_dict15
    except Exception as e:
        result_dict15['status'] = 'error'
        result_dict15['message'] = 'An error occurred'
        result_dict15['error'] = str(e)
        return result_dict15

def ploot(df, graph_parameters, labels=None):
    '''
    Generate a Plotly graph based on user parameters.
    
    Args:
        df (pd.DataFrame): Input DataFrame.
        graph_parameters (dict): Plot settings with keys:
            - column, row: For faceting (optional).
            - charts: List of chart configs for multiple charts (optional).
            - type_graph: Plot type ('scatter', 'bar', 'histogram', 'pie', 'line', 'box').
            - x, y: Columns for x and y axes.
            - names, values: For pie chart.
            - title: Plot title.
            - size, symbol, color: Styling columns (optional).
            - opacity: Transparency (default: 0.8).
            - color_scale: Color scale (default: 'Viridis').
            - bg_color: Background color (default: 'white').
            - grid: Show grid (default: False).
            - grid_color: Grid color (default: 'lightgray').
            - legand: Show legend (default: True).
            - max_points: Max data points (default: 1000).
            - highlight: Highlight top N (e.g., 'top_3').
            - hover_data: Columns for hover info (optional).
            - font: Font family (default: 'Arial').
            - margin: Margin dict (default: {'l': 40, 'r': 40, 't': 40, 'b': 40}).
            - annotations: List of annotations (optional).
        labels (dict): Custom labels for axes (optional).
    
    Returns:
        dict or str: Plotly chart HTML(s) for frontend rendering.
    
    Raises:
        ValueError: If required columns or graph type are invalid.
    '''
    # Default values
    defaults = {
        'opacity': 0.8,
        'color_scale': 'Viridis',
        'bg_color': 'white',
        'grid': False,
        'grid_color': 'lightgray',
        'legand': True,
        'max_points': 1000,
        'hover_data': [],
        'font': 'Arial',
        'margin': {'l': 40, 'r': 40, 't': 40, 'b': 40},
        'annotations': []
    }
    graph_parameters = {**defaults, **graph_parameters}

    # Extract parameters
    column = graph_parameters.get('column')
    row = graph_parameters.get('row')
    charts = graph_parameters.get('charts')
    opacity = graph_parameters['opacity']
    color_scale = graph_parameters['color_scale']
    bg_color = graph_parameters['bg_color']
    grid = graph_parameters['grid']
    grid_color = graph_parameters['grid_color']
    legand = graph_parameters['legand']
    max_points = graph_parameters['max_points']
    highlight = graph_parameters.get('highlight')
    hover_data = graph_parameters['hover_data']
    font = graph_parameters['font']
    margin = graph_parameters['margin']
    annotations = graph_parameters['annotations']

    # Downsample for performance
    if len(df) > max_points:
        df = df.sample(max_points)

# #Read The CSV File 

    # Helper function to generate a single chart
    def generate_chart(df, params):
        type_graph = params['type_graph']
        x = params.get('x')
        y = params.get('y')
        names = params.get('names')
        values = params.get('values')
        title = params.get('title')
        size = params.get('size') if params.get('size') in df.columns else None
        symbol = params.get('symbol') if params.get('symbol') in df.columns else None
        color = params.get('color') if params.get('color') in df.columns else None

        # Highlighting logic
        if highlight:
            if highlight.startswith('top_'):
                n = int(highlight.split('_')[1])
                sort_col = y if y else values
                df = df.sort_values(sort_col, ascending=False)
                df['highlight'] = False
                df.iloc[:n, df.columns.get_loc('highlight')] = True
                color = 'highlight'

        # Validate parameters
        if type_graph in ['scatter', 'bar', 'line', 'box'] and (not x or x not in df.columns or (y and y not in df.columns)):
            raise ValueError(f'Columns x={x} or y={y} not found in DataFrame for {type_graph}')
        if type_graph == 'histogram' and (not x or x not in df.columns):
            raise ValueError(f'Column x={x} not found in DataFrame for histogram')
        if type_graph == 'pie' and (not names or not values or names not in df.columns or values not in df.columns):
            raise ValueError(f'Columns names={names} or values={values} not found for pie chart')

        # Generate chart
        if type_graph == 'scatter':
            fig = px.scatter(df, x=x, y=y, title=title, color=color,
                             color_continuous_scale=color_scale, labels=labels,
                             symbol=symbol, opacity=opacity, size=size,
                             facet_col=column, facet_row=row, hover_data=hover_data)
        elif type_graph == 'bar':
            fig = px.bar(df, x=x, y=y, title=title, color=color,
                         color_continuous_scale=color_scale, labels=labels,
                         opacity=opacity, facet_col=column, facet_row=row,
                         hover_data=hover_data)
        elif type_graph == 'histogram':
            fig = px.histogram(df, x=x, title=title, color=color,
                               color_continuous_scale=color_scale, labels=labels,
                               opacity=opacity, facet_col=column, hover_data=hover_data)
        elif type_graph == 'pie':
            fig = px.pie(df, names=names, values=values, title=title,
                         color_discrete_sequence=px.colors.sequential.Viridis,
                         opacity=opacity, hover_data=hover_data)
        elif type_graph == 'line':
            fig = px.line(df, x=x, y=y, title=title, color=color,
                          color_continuous_scale=color_scale, labels=labels,
                          opacity=opacity, facet_col=column, facet_row=row,
                          hover_data=hover_data)
        elif type_graph == 'box':
            fig = px.box(df, x=x, y=y, title=title, color=color,
                         color_continuous_scale=color_scale, labels=labels,
                         facet_col=column, facet_row=row, hover_data=hover_data)
        else:
            raise ValueError(f'Unsupported graph type: {type_graph}')

        # Update layout
        fig.update_layout(
            showlegend=legand,
            plot_bgcolor=bg_color,
            font=dict(family=font, size=12),
            margin=margin,
            title_x=0.5,  # Center title
            dragmode='zoom'  # Enable zoom/pan
        )
        if grid:
            fig.update_layout(
                xaxis=dict(showgrid=True, gridcolor=grid_color),
                yaxis=dict(showgrid=True, gridcolor=grid_color)
            )

        # Add annotations
        for ann in annotations:
            fig.add_annotation(
                x=ann.get('x'),
                y=ann.get('y'),
                text=ann.get('text'),
                showarrow=True,
                arrowhead=1
            )

        return fig.show()

    # Handle multiple charts
    if charts:
        result = {}
        for i, chart_params in enumerate(charts, 1):
            chart_html = generate_chart(df, chart_params)
            result[f'chart{i}'] = chart_html
        return result
    else:
        return generate_chart(df, graph_parameters)

def generate_insights(df):
    '''
    Generates insights from a DataFrame by calculating key metrics.
    
    Parameters:
    - df: pandas DataFrame with columns (e.g., Region, Sales, Weight, etc.)
    
    Returns:
    - list: List of insight strings (e.g., ['Top Region by Sales: North', '5% rows were outliers'])
    '''
    insights = []
    
    # Step 1: Validate input
    if not isinstance(df, pd.DataFrame):
        return ['Error: Input is not a valid pandas DataFrame']
    if df.empty:
        return ['Error: DataFrame is empty']
    
    try:
        # Step 2: Identify numeric and categorical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        if not numeric_cols:
            insights.append('Warning: No numeric columns found for analysis')
        if not categorical_cols:
            insights.append('Warning: No categorical columns found for grouping')
        
        # Step 3: Calculate key metrics
        # 3.1 Top Performers (e.g., top region by sales)
        if numeric_cols and categorical_cols:
            for num_col in numeric_cols[:1]:  # Limit to one numeric column for brevity
                for cat_col in categorical_cols[:1]:  # Limit to one categorical column
                    try:
                        # Group by categorical column and sum numeric column
                        grouped = df.groupby(cat_col)[num_col].sum()
                        if not grouped.empty:
                            top_performer = grouped.idxmax()
                            top_value = grouped.max()
                            insights.append(f'Top {cat_col} by {num_col}: {top_performer} ({top_value:.2f})')
                        else:
                            insights.append(f'No valid data for grouping {num_col} by {cat_col}')
                    except Exception as e:
                        insights.append(f'Error calculating top performer for {num_col} by {cat_col}: {str(e)}')
        
        # 3.2 Outliers Percentage
        if numeric_cols:
            total_rows = len(df)
            outlier_count = 0
            for col in numeric_cols:
                try:
                    # Assume IQR method for outliers (if cleaning step didn't provide data)
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    outliers = df[col][(df[col] < lower_bound) | (df[col] > upper_bound)]
                    outlier_count += outliers.count()
                except Exception as e:
                    insights.append(f'Error calculating outliers for {col}: {str(e)}')
            
            if outlier_count > 0:
                outlier_percentage = (outlier_count / total_rows) * 100
                insights.append(f'{outlier_percentage:.2f}% rows were outliers')
            else:
                insights.append('No outliers detected')
        
        # 3.3 Missing Values Summary
        try:
            total_missing = df.isna().sum().sum()
            if total_missing > 0:
                insights.append(f'Total missing values: {total_missing}')
                # Column-wise missing percentage for key columns
                for col in numeric_cols + categorical_cols:
                    missing_count = df[col].isna().sum()
                    if missing_count > 0:
                        missing_percentage = (missing_count / total_rows) * 100
                        insights.append(f'{col} had {missing_percentage:.2f}% missing values')
            else:
                insights.append('No missing values detected')
        except Exception as e:
            insights.append(f'Error calculating missing values: {str(e)}')
        
        # Step 4: Return insights
        return insights if insights else ['No insights generated due to insufficient data']
    
    except Exception as e:
        return [f'Error generating insights: {str(e)}']


def highlight_trends(df, time_column, value_column):
    result_dict16 = {}
    try:
        if time_column not in df.columns or value_column not in df.columns:
            result_dict16['status'] = 'error'
            result_dict16['message'] = 'One or both columns do not exist!'
            return result_dict16

        if not np.issubdtype(df[value_column].dtype, np.number):
            result_dict16['status'] = 'error'
            result_dict16['message'] = 'Value column must be numeric!'
            return result_dict16
        try:
            df[time_column] = pd.to_datetime(df[time_column], errors='coerce')
            if df[time_column].isna().all():
                result_dict16['status'] = 'error'
                result_dict16['message'] = 'Time column contains invalid datetime values!'
                return result_dict16
        except Exception:
            result_dict16['status'] = 'error'
            result_dict16['message'] = 'Failed to convert time column to datetime!'
            return result_dict16


        df[value_column] = df[value_column].fillna(0)

        yearly_trends = df.groupby(df[time_column].dt.year)[value_column].sum().reset_index()
        yearly_trends.columns = ['Year', 'Total']

        recent_year = df[time_column].dt.year.max()
        monthly_trends = df[df[time_column].dt.year == recent_year].groupby(df[time_column].dt.month)[value_column].sum().reset_index()
        monthly_trends.columns = ['Month', 'Total']

        yearly_pct_change = yearly_trends['Total'].pct_change() * 100
        yearly_summary = []
        for i in range(1, len(yearly_trends)):
            year = int(yearly_trends['Year'].iloc[i])
            prev_year = int(yearly_trends['Year'].iloc[i-1])
            pct_change = yearly_pct_change.iloc[i]
            if not np.isnan(pct_change):
                trend = f'{value_column} {'increased' if pct_change > 0 else 'decreased'} by {abs(pct_change):.2f}% in {year} compared to {prev_year}'
                yearly_summary.append(trend)

        monthly_pct_change = monthly_trends['Total'].pct_change() * 100
        monthly_summary = []
        for i in range(1, len(monthly_trends)):
            month = int(monthly_trends['Month'].iloc[i])
            prev_month = int(monthly_trends['Month'].iloc[i-1])
            pct_change = monthly_pct_change.iloc[i]
            if not np.isnan(pct_change):
                trend = f'{value_column} {'increased' if pct_change > 0 else 'decreased'} by {abs(pct_change):.2f}% in month {month} compared to month {prev_month} ({recent_year})'
                monthly_summary.append(trend)

        result_dict16['status'] = 'success'
        result_dict16['trends'] = yearly_summary + monthly_summary
        result_dict16['yearly_data'] = yearly_trends.to_dict()
        result_dict16['monthly_data'] = monthly_trends.to_dict()
        return result_dict16

    except Exception as e:
        result_dict16['status'] = 'error'
        result_dict16['message'] = f'Unexpected error: {str(e)}'
        return result_dict16


def summarize_findings(df):
    result_dict17 = {}
    try:
        if df is None or df.empty:
            result_dict17['status'] = 'error'
            result_dict17['message'] = 'Dataframe is empty or invalid!'
            return result_dict17

        summary = []

        row_count = len(df)
        col_count = len(df.columns)
        summary.append(f'Dataset: {row_count} rows, {col_count} columns')

        duplicate_count = len(df) - len(df.drop_duplicates())
        if duplicate_count > 0:
            summary.append(f'Removed {duplicate_count} duplicate rows')
        else:
            summary.append('No duplicate rows found')

        numeric_cols = df.select_dtypes(include=np.number).columns
        if len(numeric_cols) > 0:
            for col in numeric_cols:
                mean_val = df[col].mean()
                median_val = df[col].median()
                if not np.isnan(mean_val):
                    summary.append(f'Average {col}: {mean_val:.2f}')
                if not np.isnan(median_val):
                    summary.append(f'Median {col}: {median_val:.2f}')
        else:
            summary.append('No numerical columns found')

        missing_count = df.isna().sum().sum()
        if missing_count > 0:
            summary.append(f'Found {missing_count} missing values in the dataset')
        else:
            summary.append('No missing values found')

        result_dict17['status'] = 'success'
        result_dict17['summary'] = summary
        return result_dict17

    except Exception as e:
        result_dict17['status'] = 'error'
        result_dict17['message'] = f'Unexpected error: {str(e)}'
        return result_dict17

def export_data(df, format):
    result_dict18 = {}
    try:
        # Check if DataFrame is valid
        if df is None or df.empty:
            result_dict18['status'] = 'error'
            result_dict18['message'] = 'DataFrame is empty or invalid!'
            return result_dict18

        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        if format.lower() == 'csv':
            filename = f'results_{unique_id}.csv'
            df.to_csv(filename, index=False)
            result_dict18['status'] = 'success'
            result_dict18['message'] = f'Exported to {filename}'
            result_dict18['file_path'] = os.path.abspath(filename)
            return result_dict18

        elif format.lower() == 'pdf':
            filename = f'results_{unique_id}.pdf'
            doc = SimpleDocTemplate(filename, pagesize=letter)
            elements = []

            # Convert DataFrame to list for table
            data = [df.columns.tolist()] + df.values.tolist()
            
            # Create table
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)

            # Build PDF
            doc.build(elements)
            result_dict18['status'] = 'success'
            result_dict18['message'] = f'Exported to {filename}'
            result_dict18['file_path'] = os.path.abspath(filename)
            return result_dict18

        else:
            result_dict18['status'] = 'error'
            result_dict18['message'] = "Unsupported format! Use 'csv' or 'pdf'.'"
            return result_dict18

    except Exception as e:
        result_dict18['status'] = 'error'
        result_dict18['message'] = f'Unexpected error: {str(e)}'
        return result_dict18
    
def share_insights(insights, trends, summary):
    result_dict = {}
    try:
        # Validate inputs
        if not all([insights, trends, summary]):
            result_dict['status'] = 'error'
            result_dict['message'] = 'Insights, trends, or summary cannot be empty!'
            return result_dict

        # Ensure inputs are lists
        insights = insights if isinstance(insights, list) else [insights]
        trends = trends if isinstance(trends, list) else [trends]
        summary = summary if isinstance(summary, list) else [summary]

        # Create plain text summary
        text_summary = 'Analysis Summary:\n\n'
        text_summary += 'Insights:\n' + '\n'.join(f'- {item}' for item in insights) + '\n\n'
        text_summary += 'Trends:\n' + '\n'.join(f'- {item}' for item in trends) + '\n\n'
        text_summary += 'Summary:\n' + '\n'.join(f'- {item}' for item in summary)

        # Create JSON summary
        json_summary = {
            'insights': insights,
            'trends': trends,
            'summary': summary
        }

        result_dict['status'] = 'success'
        result_dict['text_summary'] = text_summary
        result_dict['json_summary'] = json_summary
        return result_dict

    except Exception as e:
        result_dict['status'] = 'error'
        result_dict['message'] = f'Unexpected error: {str(e)}'
        return result_dict



# def save_analysis(dataset_id, insights, trends, summary):
#     result_dict = {}
#     try:
#         # Validate inputs
#         if not dataset_id or not all([insights, trends, summary]):
#             result_dict['status'] = 'error'
#             result_dict['message'] = 'Dataset ID or analysis data cannot be empty!'
#             return result_dict

#         # Connect to MongoDB
#         try:
#             client = MongoClient('mongodb://localhost:27017/')
#             db = client['analysis_db']
#             collection = db['analysis']
#         except ConnectionError:
#             result_dict['status'] = 'error'
#             result_dict['message'] = 'Failed to connect to MongoDB!'
#             return result_dict

#         # Prepare data to save
#         analysis_data = {
#             'insights': insights,
#             'trends': trends,
#             'summary': summary
#         }

#         # Save to MongoDB
#         try:
#             collection.update_one(
#                 {'_id': dataset_id},
#                 {'$set': analysis_data},
#                 upsert=True
#             )
#             result_dict['status'] = 'success'
#             result_dict['message'] = 'Analysis saved successfully'
#             return result_dict
#         except PyMongoError as e:
#             result_dict['status'] = 'error'
#             result_dict['message'] = f'MongoDB error: {str(e)}'
#             return result_dict

#     except Exception as e:
#         result_dict['status'] = 'error'
#         result_dict['message'] = f'Unexpected error: {str(e)}'
#         return result_dict
# def generate_insights(df):
#     try :

# Numerical Data: Scatter plot, line plot, histogram, box plot.
# #Read The CSV File 
# file_path = 'net.csv'
# df = pd.read_csv(file_path) 
# result = summary_csv(df)
# result = out_lier(df,'Sales','mode','z_score')

# result = remove_duplicates(df,'Sales','column')


# result  = fix_datatypes(df,'Sales','datetime')


# result = correct_data(df,'Region','custom',{'East' :'EAST','South':'soutH'})


# result = standardize_data(df,'Weight','to_meter')


# liistt = ['Sales','Weight']
# list_rows = [4,5]
# result = remove_data(df,list_columns=liistt,changes='Fix',list_row=list_rows )


# result = descriptive_statistics(df,liistt,'all')


# result = data_transformation(df,'new_column','Sales-Weight')


# result = normalize_data(df,'Sales')


# result = encode_categorical(df,'Weight','one_hot')


# result = bin_data(df,'Sales',[0, 1000, 2000, 3000, 4000, 5000])


# result = filter_data(df,'Sales','Sales > 2000')
# result = ploot(df, params, labels={'x': 'Sales Amount', 'y': 'Price Value'})

# result = highlight_trends(df,'Date','Sales')
# result = summarize_findings(df)
# result = summarize_findings(df)
# result = export_data(df,'pdf')
# result = share_insights()
# result = save_analysis()
# print(result)
