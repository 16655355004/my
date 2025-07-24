// 导入初始书签数据到 KV 存储
const API_BASE_URL = 'https://www.jisoolove.top';
const ADMIN_PASSWORD = 'jisoo521';

// 初始书签数据
const bookmarks = [
  {
    id: 1,
    name: "Reqable",
    description: "API抓包调试 + API测试一站式工具",
    url: "https://reqable.com/",
    icon: "🔧",
    category: "开发工具",
    color: "#00d4ff",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    name: "PowerToys",
    description: "Microsoft Learn - Windows实用工具集",
    url: "https://learn.microsoft.com/zh-cn/windows/powertoys/install",
    icon: "⚡",
    category: "系统工具",
    color: "#ff3366",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    name: "Flow Launcher",
    description: "快速启动器和搜索工具",
    url: "https://www.flowlauncher.com/",
    icon: "🚀",
    category: "效率工具",
    color: "#8b5cf6",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 4,
    name: "GitHub",
    description: "全球最大的代码托管平台",
    url: "https://github.com/",
    icon: "🐙",
    category: "开发工具",
    color: "#24292e",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 5,
    name: "VS Code",
    description: "微软开发的免费代码编辑器",
    url: "https://code.visualstudio.com/",
    icon: "💻",
    category: "开发工具",
    color: "#007acc",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 6,
    name: "Figma",
    description: "协作式界面设计工具",
    url: "https://www.figma.com/",
    icon: "🎨",
    category: "设计工具",
    color: "#f24e1e",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
];

async function importBookmarks() {
  console.log('🚀 开始导入书签数据...\n');

  try {
    for (const bookmark of bookmarks) {
      console.log(`📝 添加书签: ${bookmark.name}`);

      const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_PASSWORD}`
        },
        body: JSON.stringify(bookmark)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${bookmark.name} 添加成功`);
      } else {
        console.log(`❌ ${bookmark.name} 添加失败: ${result.error}`);
      }

      // 稍微延迟一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 所有书签导入完成！');

    // 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const checkResponse = await fetch(`${API_BASE_URL}/api/bookmarks`);
    const checkData = await checkResponse.json();

    if (checkData.success) {
      console.log(`✅ 验证成功！当前共有 ${checkData.data.length} 个书签`);
    } else {
      console.log('❌ 验证失败:', checkData.error);
    }

  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error.message);
    console.log('\n💡 请检查:');
    console.log('- Worker 是否已正确部署');
    console.log('- API 地址是否正确');
    console.log('- 管理员密码是否正确');
    console.log('- 网络连接是否正常');
  }
}

// 运行导入
importBookmarks();
