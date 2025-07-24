// 简单的 API 测试脚本
// 使用方法: node test-api.js

const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
const ADMIN_PASSWORD = 'your-admin-password';

async function testAPI() {
  console.log('🧪 开始测试 Cloudflare KV API...\n');

  try {
    // 测试获取所有书签
    console.log('1. 测试获取所有书签...');
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 获取书签成功');
      console.log(`📚 当前书签数量: ${data.data.length}`);
    } else {
      console.log('❌ 获取书签失败:', data.error);
    }

    // 测试添加书签（需要管理员权限）
    console.log('\n2. 测试添加书签...');
    const newBookmark = {
      name: '测试网站',
      description: '这是一个测试网站',
      url: 'https://test.example.com',
      icon: '🧪',
      category: '测试',
      color: '#ff6b6b'
    };

    const addResponse = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      },
      body: JSON.stringify(newBookmark)
    });

    const addData = await addResponse.json();
    
    if (addData.success) {
      console.log('✅ 添加书签成功');
      console.log(`📝 新书签 ID: ${addData.data.id}`);
      
      // 测试删除刚添加的书签
      console.log('\n3. 测试删除书签...');
      const deleteResponse = await fetch(`${API_BASE_URL}/api/bookmarks/${addData.data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_PASSWORD}`
        }
      });

      const deleteData = await deleteResponse.json();
      
      if (deleteData.success) {
        console.log('✅ 删除书签成功');
      } else {
        console.log('❌ 删除书签失败:', deleteData.error);
      }
    } else {
      console.log('❌ 添加书签失败:', addData.error);
    }

    console.log('\n🎉 API 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('\n💡 请检查:');
    console.log('- API_BASE_URL 是否正确');
    console.log('- ADMIN_PASSWORD 是否正确');
    console.log('- Cloudflare Worker 是否已部署');
    console.log('- 网络连接是否正常');
  }
}

// 运行测试
testAPI();
