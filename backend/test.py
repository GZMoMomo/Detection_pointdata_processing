def process_file(input_path, output_path):
    # 打开输入文件和输出文件
    with open(input_path, 'r') as infile, open(output_path, 'w') as outfile:
        # 逐行处理文件
        for line in infile:
            # 使用空格分割每一行
            columns = line.split()
            
            # 确保行至少有13列
            if len(columns) >= 13:
                # 删除第13列（索引为12）
                new_columns = columns[:12] + columns[13:]
                
                # 将修改后的行写入输出文件
                outfile.write(' '.join(new_columns) + '\n')
            else:
                # 如果行的列数少于13，则原样写入
                outfile.write(line)

# 文件路径
input_file = "/Users/momo/Mydata/公司资料/项目文件/中石化石油物探技术/dump_detect_hxc3d_0222_forwx.txt"
output_file = "/Users/momo/Mydata/公司资料/项目文件/中石化石油物探技术/dump_detect_hxc3d_0222_forwx_processed.txt"

# 处理文件
process_file(input_file, output_file)

print(f"处理完成！结果已保存到: {output_file}")