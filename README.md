# Mock

Mock 工具

## 使用

### 配置

编写 mock.js 文件，进行配置

```ts
const mock = require('@xdoer/mock');

mock({
  port: 10086,
  method: 'post',
  mockDir: './mock',
});
```

### Mock 数据

新建 mock 文件夹，在文件夹下新建文件 user.js

```ts
module.export = faker => {
  const users = new Array(10).fill(null).map(() => ({
    id: faker.datatype.uuid(),
    name: faker.name.findName(),
    email: faker.internet.email(),
  }));

  return [
    {
      path: '/user/:id',
      data: [
        {
          // 场景值，http://localhost:10086/user/1?scene=success
          scene: 'success',
          response: req => {
            return {
              success: true,
              result: users.find(user => user.id === req.params.id),
            };
          },
        },
        {
          // 场景值，http://localhost:10086/user/1?scene=fail
          scene: 'fail',
          response: req => {
            return {
              success: false,
              result: {},
            };
          },
        },
      ],
    },
    {
      path: '/users',
      data: [
        {
          scene: 'success',
          response: {
            success: true,
            result: users,
          },
        },
      ],
    },
  ];
};
```

### 自动重启

mock 路由编辑完之后，需要重新启动 mock 服务器

```ts
import { Config } from '@xdoer/script-runner/lib/types';
import { MockArgs } from '@xdoer/mock';
import { ChokidarArgs } from '@xdoer/chokidar';
import runScript from '@xdoer/script-runner/lib/runScript';
const debounce = require('lodash/debounce');

const debounceExec = debounce(script => {
  runScript(config.scripts.find(v => v.module === script)!);
}, 1000);

const basePath = process.cwd();

const config: Config = {
  script: [
    {
      module: '@xdoer/chokidar',
      args: <ChokidarArgs>[
        {
          options: { persistent: true, ignoreInitial: true },
          list: [
            {
              target: basePath + '/mock/**.ts',
              watch: {
                change: () => {
                  debounceExec('@xdoer/chokidar');
                },
              },
            },
          ],
        },
      ],
    },
    {
      module: '@xdoer/mock',
      args: <MockArgs>[
        {
          port: 3000,
          method: 'get',
          mockDir: './mock',
        },
      ],
      // 开启子进程运行模式
      subProcess: true,
    },
  ],
};

export default config;
```
