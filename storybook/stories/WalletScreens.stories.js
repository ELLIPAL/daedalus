// @flow
import React, { Component } from 'react';
import type { Node } from 'react';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { storiesOf } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number, select } from '@storybook/addon-knobs';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import startCase from 'lodash/startCase';
import faker from 'faker';

// Assets and helpers
import Provider from './support/StoryProvider';
import StoryDecorator from './support/StoryDecorator';
import { generateRandomTransaction, generateTransaction, generateAddres } from './support/utils';
import walletsIcon from '../../source/renderer/app/assets/images/sidebar/wallet-ic.inline.svg';
import settingsIcon from '../../source/renderer/app/assets/images/sidebar/settings-ic.inline.svg';
import adaIcon from '../../source/renderer/app/assets/images/sidebar/ada-redemption-ic.inline.svg';
import paperCertificateIcon from '../../source/renderer/app/assets/images/sidebar/paper-certificate-ic.inline.svg';
import { formattedWalletAmount } from '../../source/renderer/app/utils/ada/formatters';
import NodeSyncStatusIcon from '../../source/renderer/app/components/widgets/NodeSyncStatusIcon';
import WalletAddress from '../../source/renderer/app/domains/WalletAddress';
import { transactionStates, transactionTypes } from '../../source/renderer/app/domains/WalletTransaction';
import Wallet from '../../source/renderer/app/domains/Wallet.js'
import { assuranceModeOptions } from '../../source/renderer/app/types/transactionAssuranceTypes.js';

// Empty screen elements
import TopBar from '../../source/renderer/app/components/layout/TopBar';
import Sidebar from '../../source/renderer/app/components/sidebar/Sidebar';
import SidebarLayout from '../../source/renderer/app/components/layout/SidebarLayout';
import SidebarWalletsMenu from '../../source/renderer/app/components/sidebar/wallets/SidebarWalletsMenu';
import WalletWithNavigation from '../../source/renderer/app/components/wallet/layouts/WalletWithNavigation';

// Screens
import WalletSummary from '../../source/renderer/app/components/wallet/summary/WalletSummary';
import WalletSendForm from '../../source/renderer/app/components/wallet/WalletSendForm';
import WalletReceive from '../../source/renderer/app/components/wallet/WalletReceive';
import WalletTransactionsList from '../../source/renderer/app/components/wallet/transactions/WalletTransactionsList';
import WalletSettings from '../../source/renderer/app/components/wallet/WalletSettings';

const WALLETS = [
  {
    id: '0',
    name: 'With Password',
    amount: new BigNumber(0),
    assurance: assuranceModeOptions.NORMAL,
    hasPassword: true,
    passwordUpdateDate: moment().subtract(1, 'month').toDate(),
  },
  {
    id: '1',
    name: 'No Password',
    amount: new BigNumber(66.998),
    assurance: assuranceModeOptions.NORMAL,
    hasPassword: false,
    passwordUpdateDate: new Date(),
  }
];

const SIDEBAR_WALLETS = [
  { id: WALLETS[0].id, title: WALLETS[0].name, info: `${WALLETS[0].amount} ADA`, isConnected: true },
  { id: WALLETS[1].id, title: WALLETS[1].name, info: `${WALLETS[1].amount} ADA`, isConnected: true },
];

const sidebarCategories = [
  {
    name: 'WALLETS',
    route: '/wallets',
    icon: walletsIcon,
  },
  // {
  //   name: 'SETTINGS',
  //   route: '/settings',
  //   icon: settingsIcon,
  // },
  {
    name: 'ADA_REDEMPTION',
    route: '/ada-redemption',
    icon: adaIcon,
  },
  {
    name: 'PAPER_WALLET',
    route: '/paper-wallet-create-certificate',
    icon: paperCertificateIcon,
  }
];

const sidebarMenus = observable({
  wallets: {
    items: SIDEBAR_WALLETS,
    activeWalletId: '1',
    actions: {
      onAddWallet: action('toggleAddWallet'),
      onWalletItemClick: (walletId: string) => {
        runInAction(() => sidebarMenus.wallets.activeWalletId = walletId);
      }
    }
  }
});

const validateAmount = (amountInNaturalUnits: string) => (
  new Promise(resolve => {
    setTimeout(() => {
      resolve(amountInNaturalUnits ? true : false);
    }, 2000);
  })
);
const calculateTransactionFee = (receiver: string, amount: string) => (
  new Promise(resolve => {
    setTimeout(() => {
      resolve((receiver || amount) ? true : false);
    }, 2000);
  })
);

type Props = {
  storyName?: string,
  children?: any | Node
};

@observer
class WalletScreen extends Component<Props> {

  render() {

    const { children, storyName='' } = this.props;
    const activeNavItem = storyName.split(' ')[0].toLowerCase();

    return (
      <div
        style={{
          height: '100vh'
        }}
      >
        <SidebarLayout
          sidebar={this.getSidebar(!!children)}
          topbar={this.getTopbar(activeNavItem)}
        >
          {
            children &&
              (
                <WalletWithNavigation
                  isActiveScreen={item => item === activeNavItem}
                  onWalletNavItemClick={linkTo('WalletScreens', item => startCase(item))}
                >
                  {children}
                </WalletWithNavigation>
              )
          }
        </SidebarLayout>
      </div>
    );
  }

  @observable
  isShowingSubMenus = !!this.props.children;

  getSidebar = () => (
    <Sidebar
      categories={sidebarCategories}
      activeSidebarCategory={sidebarCategories[0].route}
      menus={sidebarMenus}
      isShowingSubMenus={this.isShowingSubMenus}
      onCategoryClicked={action('onCategoryClicked')}
      isDialogOpen={() => false}
      onAddWallet={action('onAddWallet')}
      openDialogAction={action('openDialog')}
      onSubmitSupportRequest={()=>{}}
    />
  );

  getTopbar = (activeNavItem: string) => (
    <TopBar
      onToggleSidebar={() => {
        runInAction(() => this.isShowingSubMenus = !this.isShowingSubMenus);
      }}
      formattedWalletAmount={formattedWalletAmount}
      currentRoute={`/wallets/${WALLETS[sidebarMenus.wallets.activeWalletId].id}/${activeNavItem}`}
      activeWallet={activeNavItem !== 'empty' ? new Wallet(WALLETS[sidebarMenus.wallets.activeWalletId]) : null}
      showSubMenuToggle={true}
      showSubMenus={this.isShowingSubMenus}
    >
      <NodeSyncStatusIcon
        networkStatus={{
          isSynced: true,
          syncPercentage: 100,
        }}
        isProduction
      />
    </TopBar>
  );
}

storiesOf('WalletScreens', module)

  .addDecorator((story, context) => {

    const storyWithKnobs = withKnobs(story, context);

    return (
      <StoryDecorator>
        <Provider
          activeWallet={WALLETS[sidebarMenus.wallets.activeWalletId]}
        >
          <WalletScreen
            storyName={context.story}
          >
            {storyWithKnobs}
          </WalletScreen>
        </Provider>
      </StoryDecorator>
    )
  })

  // ====== Stories ======

  .add('Empty', () => false)

  .add('Wallet Navigation', () => (
    <div>&nbsp;</div>
  ))

  .add('Summary', () => (
    <WalletSummary
      walletName={text('Wallet name', 'Wallet name')}
      amount={text('Amount', '45119903750165.23')}
      pendingAmount={{
        incoming: new BigNumber(number('Incoming', 1)),
        outgoing: new BigNumber(number('Outgoing', 2)),
        total: new BigNumber(3)
      }}
      numberOfTransactions={number('Number of transactions', 20303585)}
      isLoadingTransactions={boolean('isLoadingTransactions', false)}
    />
  ))

  .add('Send', () => (
    <WalletSendForm
      currencyUnit="Ada"
      currencyMaxFractionalDigits={ 6}
      currencyMaxIntegerDigits={11}
      validateAmount={validateAmount}
      calculateTransactionFee={calculateTransactionFee}
      addressValidator={()=>{}}
      openDialogAction={()=>{}}
      isDialogOpen={()=> boolean('hasDialog', false)}
      isRestoreActive={boolean('isRestoreActive', false)}
    />
  ))

  .add('Receive', () => (
    <WalletReceive
      walletAddress={text('Wallet address', '5628aab8ac98c963e4a2e8cfce5aa1cbd4384fe2f9a0f3c5f791bfb83a5e02ds')}
      isWalletAddressUsed={boolean('isWalletAddressUsed', false)}
      walletAddresses={[
        ...Array.from(Array(number('Addresses', 1))).map(() => generateAddres()),
        ...Array.from(Array(number('Addresses (used)', 1))).map(() => generateAddres(true)),
      ]}
      onGenerateAddress={()=>{}}
      onCopyAddress={()=>{}}
      isSidebarExpanded
      walletHasPassword={WALLETS[sidebarMenus.wallets.activeWalletId].hasPassword}
      isSubmitting={boolean('isSubmitting', false)}
    />
  ))

  .add('Transactions', () => (
    <WalletTransactionsList
      transactions={[
        generateTransaction(transactionTypes.INCOME, new Date(), new BigNumber(1), 1),
        generateTransaction(transactionTypes.EXCHANGE, new Date(), new BigNumber(1)),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(1, 'days').toDate(), new BigNumber(2), 0, transactionStates.PENDING),
        generateTransaction(transactionTypes.INCOME, moment().subtract(1, 'days').toDate(), new BigNumber(1), 0, transactionStates.FAILED),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(2, 'days').toDate(), new BigNumber(3)),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(3, 'days').toDate(), new BigNumber(5)),
      ]}
      isLoadingTransactions={false}
      hasMoreToLoad={false}
      assuranceMode={{ low: 1, medium: 2 }}
      walletId="test-wallet"
      formattedWalletAmount={formattedWalletAmount}
    />
  ));

  // .add('Settings', () => (
  //   <WalletSettings
  //     activeField={null}
  //     assuranceLevels={[
  //       {
  //         "value": assuranceModeOptions.NORMAL,
  //         "label": {
  //           id: 'global.assuranceLevel.normal',
  //           defaultMessage: '!!!Normal',
  //           description: ''
  //         }
  //       },
  //       {
  //         "value": assuranceModeOptions.STRICT,
  //         "label": {
  //           id: 'global.assuranceLevel.strict',
  //           defaultMessage: '!!!Strict',
  //           description: ''
  //         }
  //       }
  //     ]}
  //     isDialogOpen={()=>false}
  //     isInvalid={false}
  //     isSubmitting={false}
  //     isWalletPasswordSet={false}
  //     lastUpdatedField={null}
  //     nameValidator={()=>true}
  //     onCancelEditing={()=>{}}
  //     onFieldValueChange={()=>{}}
  //     onStartEditing={()=>{}}
  //     onStopEditing={()=>{}}
  //     openDialogAction={()=>{}}
  //     walletAssurance={assuranceModeOptions.NORMAL}
  //     walletName="Test wallet"
  //     walletPasswordUpdateDate={moment().subtract(1, 'month').toDate()}
  //   />
  // ));
