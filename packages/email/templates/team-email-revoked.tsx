import config from '@documenso/tailwind-config';

import { Body, Container, Head, Hr, Html, Preview, Section, Tailwind, Text } from '../components';
import { TemplateFooter } from '../template-components/template-footer';
import TemplateImage from '../template-components/template-image';

export type TeamEmailRevokedTemplateProps = {
  assetBaseUrl: string;
  baseUrl: string;
  revokedEmail: string;
  teamName: string;
  teamUrl: string;
};

export const TeamEmailRevokedTemplate = ({
  assetBaseUrl = 'http://localhost:3002',
  baseUrl = 'https://documenso.com',
  revokedEmail = 'example@documenso.com',
  teamName = 'Team Name',
  teamUrl = 'demo',
}: TeamEmailRevokedTemplateProps) => {
  const previewText = `Team email revoked for ${teamName} on Documenso`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: config.theme.extend.colors,
            },
          },
        }}
      >
        <Body className="mx-auto my-auto font-sans">
          <Section className="bg-white text-slate-500">
            <Container className="mx-auto mb-2 mt-8 max-w-xl rounded-lg border border-solid border-slate-200 px-2 pt-2 backdrop-blur-sm">
              <TemplateImage
                assetBaseUrl={assetBaseUrl}
                className="mb-4 h-6 p-2"
                staticAsset="logo.png"
              />

              <Section>
                <TemplateImage
                  className="mx-auto"
                  assetBaseUrl={assetBaseUrl}
                  staticAsset="mail-open-alert.png"
                />
              </Section>

              <Section className="p-2 text-slate-500">
                <Text className="text-center text-lg font-medium text-black">
                  Your team email address has been revoked
                </Text>

                <Text className="my-1 text-center text-base">
                  The owner of <span className="font-bold">{revokedEmail}</span> has removed their
                  email from being used by the following team
                </Text>

                <div className="mx-auto mb-6 mt-2 w-fit rounded-lg bg-gray-50 px-4 py-2 text-base font-medium text-slate-600">
                  {baseUrl.replace('https://', '')}/t/{teamUrl}
                </div>
              </Section>
            </Container>

            <Hr className="mx-auto mt-12 max-w-xl" />

            <Container className="mx-auto max-w-xl">
              <TemplateFooter isDocument={false} />
            </Container>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TeamEmailRevokedTemplate;
