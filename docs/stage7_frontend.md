### **Nekolinic开发指南：统一界面与模板化设计**

#### **1. 核心设计理念的演进**

根据您的新要求，我们将项目的核心设计理念更新为：

1. **功能统一化 (Unified Functionality)**：所有登录用户都将看到相同的界面布局和功能入口。系统不再通过隐藏UI元素来进行权限控制，而是依赖后端API来最终裁决操作权限。
2. **模板驱动 (Template-Driven)**：所有核心的医疗文书，如病历、处方和报告，都将拥有标准化的录入和打印模板，确保格式的专业、统一，并提供良好的用户体验。

#### **2. 统一化界面实现**

这个改动将主要集中在前端，目标是简化逻辑，提供一致的体验。

**2.1. 移除角色相关的UI逻辑**

- **静态导航栏**：您之前构想的左侧导航栏现在应变为**静态的**。移除所有基于用户角色来动态显示/隐藏菜单项的JavaScript代码。所有模块入口（如“患者管理”、“财务”等）对所有登录用户都可见。

**2.2. 优雅地处理后端权限（关键）**

虽然前端界面是统一的，但您在后端API层已经实现的、基于角色的权限控制（例如 `Depends(security.requires_role("admin"))`）依然在生效，这是保障数据安全的关键防线。

- **问题**：一个非管理员用户（如医生）可能会点击一个他可见但无权操作的按钮（例如“删除患者”）。此时，后端API会正确地返回 `403 Forbidden` 错误。如果前端不处理，用户会感到困惑。

- **解决方案**：必须在前端的API调用逻辑中，增加对HTTP状态码的判断，并向用户提供清晰的反馈。

- **实现代码示例 (`frontend/js/apiClient.js` 或类似文件中)**：

  JavaScript

  ```
  // 封装一个能处理错误的fetch函数
  async function authorizedFetch(url, options) {
      const token = localStorage.getItem('accessToken');
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      };
  
      const response = await fetch(url, { ...options, headers });
  
      if (response.status === 401) {
          // Token失效或未登录
          alert('您的登录已过期，请重新登录。');
          window.location.href = '/login.html'; // 跳转到登录页
          throw new Error('认证失败');
      }
  
      if (response.status === 403) {
          // 权限不足
          alert('您没有执行此操作的权限。');
          throw new Error('权限不足');
      }
  
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '操作失败');
      }
  
      // 对于204 No Content等成功但无返回体的响应
      if (response.status === 204) {
          return null;
      }
  
      return response.json();
  }
  ```

  您应该使用这个 `authorizedFetch` 函数来执行所有需要授权的API请求，它会自动处理权限问题并给用户明确提示。

#### **3. 可编辑模板的实现方案**

我们将“模板化”分为两类：**数据录入模板**（更规范的表单）和**打印输出模板**（专业格式的文档）。

**3.1. 数据录入模板 (以“病历”为例)**

我们通过优化HTML表单结构，来创建一个视觉上更专业、逻辑上更清晰的“录入模板”。

- **界面设计**：使用 `<fieldset>` 和 `<legend>` 对表单进行分组，模拟真实病历的章节。

- **`index.html` 中的病历表单示例**：

  HTML

  ```
  <form id="medical-record-form">
      <fieldset>
          <legend>基本信息</legend>
          <p><strong>患者:</strong> <span id="record-patient-name"></span></p>
          <p><strong>医生:</strong> <span id="record-doctor-name"></span></p>
          <p><strong>就诊日期:</strong> <input type="datetime-local" name="record_date" required></p>
      </fieldset>
  
      <fieldset>
          <legend>临床记录 (SOAP)</legend>
          <label for="symptoms">主诉 (S):</label>
          <textarea id="symptoms" name="symptoms" rows="3"></textarea>
  
          <label for="diagnosis">诊断 (A):</label>
          <textarea id="diagnosis" name="diagnosis" rows="2" required></textarea>
  
          <label for="treatment_plan">治疗计划 (P):</label>
          <textarea id="treatment_plan" name="treatment_plan" rows="3"></textarea>
      </fieldset>
  
      <fieldset>
          <legend>处方详情</legend>
          </fieldset>
  
      <button type="submit">保存病历</button>
  </form>
  ```

**3.2. 打印输出模板 (以“处方”为例)**

我们将创建一个专用于打印的、格式精美的HTML页面。

- **步骤A: 创建打印模板 `prescription_print.html`**

  在 `frontend/` 目录下创建一个新文件 `prescription_print.html`。它的布局将模仿一张真实的处方单。

  HTML

  ```
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <title>处方单</title>
      <link rel="stylesheet" href="css/print_style.css">
  </head>
  <body>
      <div class="prescription-container">
          <header>
              <h1>Nekolinic 诊所 - 处方笺 (Rp.)</h1>
          </header>
          <section class="patient-info">
              <span><strong>姓名:</strong> <span id="p-name"></span></span>
              <span><strong>性别:</strong> <span id="p-gender"></span></span>
              <span><strong>年龄:</strong> <span id="p-age"></span></span>
              <span><strong>日期:</strong> <span id="p-date"></span></span>
          </section>
          <hr>
          <section class="drug-list">
              </section>
          <hr>
          <footer>
              <p><strong>医生签名:</strong> <span id="p-doctor"></span></p>
              <p><strong>药剂师:</strong> _________________</p>
          </footer>
      </div>
      <script>
          // 此处的JS负责从URL参数或localStorage获取数据并填充到上面的span中
          // 填充完毕后调用 window.print()
      </script>
  </body>
  </html>
  ```

- **步骤B: 创建打印专用样式 `print_style.css`**

  在 `frontend/css/` 目录下创建 `print_style.css`，用于控制打印布局。

  CSS

  ```
  /* frontend/css/print_style.css */
  body { font-family: 'Songti SC', 'SimSun', serif; }
  .prescription-container { width: 18cm; margin: auto; }
  /* ...更多关于边距、字体大小、边框的专业格式定义... */
  
  @media print {
    body { -webkit-print-color-adjust: exact; } /* 确保打印背景色和颜色 */
    /* 在打印时可以隐藏不必要的元素 */
  }
  ```

- **步骤C: 实现“打印”按钮的逻辑**

  在主应用界面查看处方详情时，提供一个“打印处方”按钮。点击该按钮后，JavaScript执行以下操作：

  JavaScript

  ```
  async function printPrescription(prescriptionId) {
      // 1. 从API获取完整的处方数据
      const prescriptionData = await authorizedFetch(`/pharmacy/prescriptions/${prescriptionId}`);
  
      // 2. 将数据暂存到localStorage，以便新窗口可以访问
      localStorage.setItem('printData', JSON.stringify(prescriptionData));
  
      // 3. 打开新的打印窗口
      const printWindow = window.open('prescription_print.html', '_blank');
  
      // 4. (在 prescription_print.html 的脚本中)
      // 读取 localStorage 中的数据，填充到页面模板中，然后调用 window.print()
  }
  ```

#### **4. 最终打包**

完成以上所有开发后，您的 `frontend` 文件夹会包含 `index.html`, `login.html`, `prescription_print.html` 以及相关的CSS和JS文件。您只需像之前一样运行`PyInstaller`命令，所有这些新资源都会被自动打包进去，因为它们都在 `--add-data "frontend;frontend"` 的作用范围内。

遵循这份终极指南，您将能交付一个界面统一、体验流畅、文书规范的专业级本地诊所管理系统。