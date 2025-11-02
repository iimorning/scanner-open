#!/usr/bin/env node

/**
 * 使用 GitHub API 创建仓库并推送代码
 * 需要 GitHub Personal Access Token
 */

const https = require('https');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createRepo() {
    console.log('🚀 GitHub 仓库创建助手\n');

    // 获取用户信息
    const repoName = await question('请输入仓库名称 (默认: scanner-open): ') || 'scanner-open';
    const description = await question('请输入仓库描述 (默认: Open-source privacy scanner): ') || 'Open-source privacy scanner for Android, iOS, and Web applications';
    const isPrivate = await question('是否私有仓库? (y/N): ').then(answer => answer.toLowerCase() === 'y');
    
    console.log('\n⚠️  需要 GitHub Personal Access Token');
    console.log('如果您还没有 token，请访问: https://github.com/settings/tokens');
    console.log('创建 token 时需要勾选 "repo" 权限\n');
    
    const token = await question('请输入您的 GitHub Token: ');
    
    if (!token || token.trim() === '') {
        console.error('\n❌ Token 不能为空');
        process.exit(1);
    }

    const username = await question('请输入您的 GitHub 用户名: ');
    
    if (!username || username.trim() === '') {
        console.error('\n❌ 用户名不能为空');
        process.exit(1);
    }

    // 创建仓库
    console.log('\n📦 正在创建 GitHub 仓库...');
    
    const repoData = JSON.stringify({
        name: repoName,
        description: description,
        private: isPrivate,
        auto_init: false,
        license_template: 'mit'
    });

    const options = {
        hostname: 'api.github.com',
        path: '/user/repos',
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'scanner-open-setup',
            'Content-Type': 'application/json',
            'Content-Length': repoData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 201) {
                    const repo = JSON.parse(data);
                    console.log(`✅ 仓库创建成功: ${repo.html_url}\n`);
                    resolve(repo);
                } else {
                    console.error(`❌ 创建仓库失败: ${res.statusCode}`);
                    console.error('响应:', data);
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求错误:', error.message);
            reject(error);
        });

        req.write(repoData);
        req.end();
    }).then(async (repo) => {
        // 配置 git remote 并推送
        console.log('📤 正在配置远程仓库并推送代码...\n');
        
        try {
            // 检查是否已有 remote
            try {
                execSync('git remote get-url origin', { stdio: 'ignore' });
                console.log('⚠️  已存在 remote origin，正在更新...');
                execSync(`git remote set-url origin ${repo.clone_url}`, { stdio: 'inherit' });
            } catch {
                execSync(`git remote add origin ${repo.clone_url}`, { stdio: 'inherit' });
            }

            // 重命名分支为 main（如果需要）
            try {
                execSync('git branch -M main', { stdio: 'inherit' });
            } catch {
                // 分支可能已经是 main
            }

            // 推送代码
            console.log('\n正在推送代码到 GitHub...');
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            console.log('\n✅ 完成！您的代码已成功推送到 GitHub');
            console.log(`📍 仓库地址: ${repo.html_url}`);
            console.log(`🔗 Clone 地址: ${repo.clone_url}\n`);
            
        } catch (error) {
            console.error('\n❌ 推送代码时出错:', error.message);
            console.log('\n您可以手动执行以下命令：');
            console.log(`  git remote add origin ${repo.clone_url}`);
            console.log('  git branch -M main');
            console.log('  git push -u origin main\n');
        }
    });
}

createRepo().catch(error => {
    console.error('\n❌ 操作失败:', error.message);
    process.exit(1);
}).finally(() => {
    rl.close();
});

